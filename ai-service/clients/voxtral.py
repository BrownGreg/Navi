import logging

import httpx

import config
from mock import mock_transcribe
from schemas import TranscriptSegment

logger = logging.getLogger("ai-service.voxtral")

# Integration avec l'endpoint de transcription de Mistral (Voxtral).
# Voxtral tourne sous la meme cle API que le reste de Mistral (pas de cle separee).
# Quand diarize=true est envoye sans streaming, l'API exige aussi
# timestamp_granularities=segment, sinon elle repond 422. La reponse a alors
# cette forme (verifiee en direct au 2026-07-23) :
# {"text": "...", "segments": [{"text", "start", "end", "speaker_id": "speaker_1", ...}], ...}
# speaker_id est une chaine ("speaker_1", "speaker_2", ...), pas un entier.
#
# Portage de lib/voxtral.ts (ex-integration Node) vers ce service FastAPI.
#
# Pas de fallback Scaleway ici, contrairement a mistral_cr.py/classifier.py.
# Raison : Scaleway n'expose Voxtral qu'en "Voxtral Small 24B" via une API de
# type chat-completions/multimodale (tokens), pas via l'endpoint de
# transcription dedie avec diarize=true + timestamp_granularities=segment
# dont depend le parsing ci-dessous - donc pas un remplacement direct, et la
# diarisation par locuteur n'est pas garantie disponible sous cette forme.
# Voxtral-Mini-3B-2507 (le modele batch, meme famille que voxtral-mini-latest)
# est en revanche publie en open-weights (Apache 2.0, HF: mistralai/
# Voxtral-Mini-3B-2507), auto-hebergeable via vLLM (compatible OpenAI
# /v1/audio/transcriptions nativement, ~9.5 Go de VRAM). Un auto-hebergement
# reste, de plus, la seule option qui ne rajoute aucun sous-traitant tiers
# (voir l'argument de conformite de la landing page) - contrairement a
# Scaleway pour le CR/la classification, qui EST un deuxieme sous-traitant.
#
# SELF_HOSTED_VOXTRAL_URL (config.py) documente ce chemin sans l'activer :
# aucune infra GPU n'a ete provisionnee pour ce projet, donc _transcribe_via_
# self_hosted() ci-dessous n'a jamais ete testee contre un vrai serveur vLLM
# (la diarisation en particulier n'est pas garantie identique a l'API
# Mistral). A valider avant toute mise en production reelle.


async def _transcribe_via_self_hosted(
    audio_bytes: bytes, mime_type: str
) -> list[TranscriptSegment]:
    """Chemin non teste - cf. commentaire de module. Suppose un serveur vLLM
    local exposant Voxtral-Mini-3B-2507 sur un endpoint compatible OpenAI
    /v1/audio/transcriptions, avec les memes parametres diarize/
    timestamp_granularities que Mistral (a confirmer une fois l'infra
    provisionnee - vLLM ne garantit pas cette forme de reponse a l'identique)."""
    files = {"file": ("recording.webm", audio_bytes, mime_type or "audio/webm")}
    data = {
        "model": "voxtral-mini-3b-2507",
        "diarize": "true",
        "timestamp_granularities": "segment",
    }

    async with httpx.AsyncClient(timeout=60) as client:
        res = await client.post(
            f"{config.SELF_HOSTED_VOXTRAL_URL}/v1/audio/transcriptions", data=data, files=files
        )
    if res.status_code >= 400:
        raise RuntimeError(f"self-hosted Voxtral error: {res.status_code} - {res.text}")

    body = res.json()
    raw_segments = body.get("segments") or []
    return [
        TranscriptSegment(
            speaker=_speaker_label(s.get("speaker_id")),
            text=s.get("text", ""),
            start=s.get("start", 0),
            end=s.get("end"),
        )
        for s in raw_segments
    ]


def _speaker_label(speaker_id: object) -> str:
    if isinstance(speaker_id, str) and speaker_id.startswith("speaker_"):
        return f"Intervenant {speaker_id.removeprefix('speaker_')}"
    if speaker_id is None:
        return "Intervenant 1"
    return f"Intervenant {speaker_id}"


async def transcribe_audio(
    audio_bytes: bytes, mime_type: str
) -> tuple[list[TranscriptSegment], str]:
    if not config.MISTRAL_API_KEY:
        return await mock_transcribe(), "mock"

    try:
        files = {"file": ("recording.webm", audio_bytes, mime_type or "audio/webm")}
        data = {
            "model": "voxtral-mini-latest",
            "diarize": "true",
            "timestamp_granularities": "segment",
        }

        async with httpx.AsyncClient(timeout=60) as client:
            res = await client.post(
                config.MISTRAL_TRANSCRIBE_URL,
                headers={"Authorization": f"Bearer {config.MISTRAL_API_KEY}"},
                data=data,
                files=files,
            )
        if res.status_code >= 400:
            raise RuntimeError(f"Voxtral transcription API error: {res.status_code} - {res.text}")

        body = res.json()
        raw_segments = body.get("segments") or []
        fallback_text = body.get("text") or ""

        if not isinstance(raw_segments, list) or len(raw_segments) == 0:
            if not fallback_text:
                raise RuntimeError(
                    f"empty or unrecognized transcription shape from Voxtral: {body}"
                )
            return [TranscriptSegment(speaker="Intervenant 1", text=fallback_text, start=0)], "real"

        segments = [
            TranscriptSegment(
                speaker=_speaker_label(s.get("speaker_id")),
                text=s.get("text", ""),
                start=s.get("start", 0),
                end=s.get("end"),
            )
            for s in raw_segments
        ]
        return segments, "real"
    except Exception as err:  # noqa: BLE001 - filet de securite volontaire
        logger.error("[voxtral] Mistral indisponible: %s", err)

        if config.SELF_HOSTED_VOXTRAL_URL:
            try:
                segments = await _transcribe_via_self_hosted(audio_bytes, mime_type)
                return segments, "real"
            except Exception as fallback_err:  # noqa: BLE001 - filet de securite volontaire
                logger.error("[voxtral] auto-hebergement egalement en echec: %s", fallback_err)

        logger.error("[voxtral] fallback to mock")
        return await mock_transcribe(), "mock"
