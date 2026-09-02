import asyncio
import json
import logging

import httpx

import config
from clients import scaleway
from mock import mock_generate_cr
from schemas import CRAction, MeetingCR, TranscriptSegment

logger = logging.getLogger("ai-service.mistral_cr")

# Generation du compte-rendu via l'API Chat Completions de Mistral AI (meme
# fournisseur/compte que la transcription Voxtral - cf. config.py). Remplace
# l'ancienne integration Kimi K3 (Moonshot AI, hors UE). Si Mistral echoue,
# retente via Scaleway (clients/scaleway.py, sous-traitant de secours UE)
# avant de basculer sur le mock - uniquement si SCALEWAY_API_KEY est
# configuree, sinon comportement strictement inchange.

SYSTEM_PROMPT = (
    "Tu structures des comptes-rendus de reunion en francais. Reponds uniquement "
    "en JSON avec les cles: resume (string), decisions (array de string), actions "
    "(array d'objets {text, owner}), themes (array de string)."
)

# Delais (secondes) entre les tentatives suivant un 429/5xx ou une erreur
# reseau transitoire. len(RETRY_DELAYS_SECONDS) = nombre de retries, donc 3
# tentatives au total. Pas de retry sur les 4xx de validation (mauvais
# format, cle invalide) : elles ne se resolvent pas en reessayant.
RETRY_DELAYS_SECONDS = (1, 3)


async def _post_with_retry(payload: dict) -> httpx.Response:
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
                    "[mistral_cr] erreur reseau, retry %d/%d: %s",
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
                    "[mistral_cr] erreur transitoire %s, retry %d/%d",
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


def _parse_cr(res: httpx.Response) -> MeetingCR:
    body = res.json()
    content = body.get("choices", [{}])[0].get("message", {}).get("content")
    if not content:
        raise RuntimeError("empty response from chat API")

    parsed = json.loads(content)
    return MeetingCR(
        resume=parsed.get("resume", ""),
        decisions=parsed.get("decisions", []),
        actions=[CRAction(**a) for a in parsed.get("actions", [])],
        themes=parsed.get("themes", []),
    )


async def generate_cr(transcript: list[TranscriptSegment]) -> tuple[MeetingCR, str]:
    transcript_text = "\n".join(f"{s.speaker}: {s.text}" for s in transcript)
    payload = {
        "model": config.MISTRAL_CHAT_MODEL,
        "response_format": {"type": "json_object"},
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": f"Voici la transcription:\n\n{transcript_text}"},
        ],
    }

    if config.MISTRAL_API_KEY:
        try:
            res = await _post_with_retry(payload)
            return _parse_cr(res), "real"
        except Exception as err:  # noqa: BLE001 - filet de securite volontaire
            logger.error("[mistral_cr] Mistral indisponible, tentative sous-traitant de secours: %s", err)

    if config.SCALEWAY_API_KEY:
        try:
            res = await scaleway.post_chat_with_retry(payload)
            return _parse_cr(res), "real"
        except Exception as err:  # noqa: BLE001 - filet de securite volontaire
            logger.error("[mistral_cr] sous-traitant de secours egalement en echec: %s", err)

    return await mock_generate_cr(transcript), "mock"
