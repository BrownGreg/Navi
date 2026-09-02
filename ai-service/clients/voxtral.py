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
            "model": "voxtral-mini-transcribe-realtime-2602",
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
        logger.error("[voxtral] fallback to mock: %s", err)
        return await mock_transcribe(), "mock"
