"""Client de classification IA pour les reunions Navi.

Utilise l'API Chat Completions de Mistral AI (meme fournisseur/compte que la
transcription Voxtral et la generation du CR - cf. config.py) pour extraire
le ton global, le niveau d'urgence et les themes d'une transcription. Si
Mistral echoue, retente via Scaleway (clients/scaleway.py, sous-traitant de
secours UE) avant de basculer sur un mock - uniquement si SCALEWAY_API_KEY
est configuree, sinon comportement strictement inchange. Remplace l'ancienne
integration Kimi K3 (Moonshot AI, hors UE).
"""

import asyncio
import json
import logging

import httpx

import config
from clients import scaleway
from schemas import ClassificationResult, SegmentClassification, TranscriptSegment

logger = logging.getLogger("ai-service.classifier")

SYSTEM_PROMPT = (
    "Tu analyses des transcriptions de reunions professionnelles en francais. "
    "Reponds uniquement en JSON avec les cles suivantes :\n"
    '- tone : string parmi "positif", "neutre", "negatif", "tendu"\n'
    '- urgency : string parmi "faible", "normale", "haute"\n'
    "- themes : array de string (5 themes maximum)\n"
    "- per_segment : array d'objets {speaker: string, theme: string, tone: string}, "
    "un objet par segment de la transcription fournie"
)

# Delais (secondes) entre les tentatives suivant un 429/5xx ou une erreur
# reseau transitoire. Meme politique de retry que clients/mistral_cr.py.
RETRY_DELAYS_SECONDS = (1, 3)

_MOCK_RESULT = ClassificationResult(
    tone="neutre",
    urgency="normale",
    themes=["Réunion générale"],
    per_segment=[],
)


async def _post_with_retry(payload: dict) -> httpx.Response:
    """Envoie une requete POST a l'API Mistral Chat Completions avec logique de retry.

    Args:
        payload: Corps JSON de la requete Chat Completions.

    Returns:
        Reponse HTTP de l'API.

    Raises:
        RuntimeError: Si toutes les tentatives echouent ou si l'API
            retourne une erreur non transitoire (4xx hors 429).
        httpx.TimeoutException | httpx.TransportError: Si la derniere
            tentative se solde par une erreur reseau.
    """
    last_err: Exception | None = None
    for attempt, delay in enumerate((0, *RETRY_DELAYS_SECONDS)):
        if delay:
            await asyncio.sleep(delay)

        try:
            async with httpx.AsyncClient(timeout=60) as client:
                res = await client.post(
                    config.MISTRAL_CHAT_URL,
                    headers={
                        "Authorization": f"Bearer {config.MISTRAL_API_KEY}",
                        "Content-Type": "application/json",
                    },
                    json=payload,
                )
        except (httpx.TimeoutException, httpx.TransportError) as err:
            last_err = err
            if attempt < len(RETRY_DELAYS_SECONDS):
                logger.warning(
                    "[classifier] erreur reseau, retry %d/%d: %s",
                    attempt + 1,
                    len(RETRY_DELAYS_SECONDS),
                    err,
                )
                continue
            raise

        if res.status_code == 429 or res.status_code >= 500:
            last_err = RuntimeError(f"Mistral chat API transient error: {res.status_code}")
            if attempt < len(RETRY_DELAYS_SECONDS):
                logger.warning(
                    "[classifier] erreur transitoire %s, retry %d/%d",
                    res.status_code,
                    attempt + 1,
                    len(RETRY_DELAYS_SECONDS),
                )
                continue
            raise last_err

        if res.status_code >= 400:
            raise RuntimeError(f"Mistral chat API error: {res.status_code}")

        return res

    raise last_err  # pragma: no cover - inatteignable, la boucle retourne ou leve avant


async def classify(transcript: list[TranscriptSegment]) -> tuple[ClassificationResult, str]:
    """Classifie une transcription de reunion via l'API Chat Completions de Mistral.

    Extrait le ton global, le niveau d'urgence, les themes principaux et
    une classification par segment. Retourne un mock si la cle API est
    absente ou si l'appel echoue.

    Args:
        transcript: Liste de segments de transcription a analyser.

    Returns:
        Tuple (ClassificationResult, source) ou source vaut "real" ou "mock".
    """
    transcript_text = "\n".join(
        f"[Segment {i + 1}] {s.speaker}: {s.text}" for i, s in enumerate(transcript)
    )
    payload = {
        "model": config.MISTRAL_CHAT_MODEL,
        "response_format": {"type": "json_object"},
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {
                "role": "user",
                "content": f"Voici la transcription a analyser:\n\n{transcript_text}",
            },
        ],
    }

    if config.MISTRAL_API_KEY:
        try:
            res = await _post_with_retry(payload)
            return _parse_classification(res), "real"
        except Exception as err:  # noqa: BLE001 - filet de securite volontaire
            logger.error("[classifier] Mistral indisponible, tentative sous-traitant de secours: %s", err)
    else:
        logger.info("[classifier] MISTRAL_API_KEY absente")

    if config.SCALEWAY_API_KEY:
        try:
            res = await scaleway.post_chat_with_retry(payload)
            return _parse_classification(res), "real"
        except Exception as err:  # noqa: BLE001 - filet de securite volontaire
            logger.error("[classifier] sous-traitant de secours egalement en echec: %s", err)

    logger.info("[classifier] retour mock")
    return _MOCK_RESULT, "mock"


def _parse_classification(res: httpx.Response) -> ClassificationResult:
    body = res.json()
    content = body.get("choices", [{}])[0].get("message", {}).get("content")
    if not content:
        raise RuntimeError("empty response from chat API")

    parsed = json.loads(content)
    return ClassificationResult(
        tone=parsed.get("tone", "neutre"),
        urgency=parsed.get("urgency", "normale"),
        themes=parsed.get("themes", [])[:5],
        per_segment=[
            SegmentClassification(
                speaker=seg.get("speaker", ""),
                theme=seg.get("theme", ""),
                tone=seg.get("tone", "neutre"),
            )
            for seg in parsed.get("per_segment", [])
        ],
    )
