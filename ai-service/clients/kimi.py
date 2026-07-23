import asyncio
import json
import logging

import httpx

import config
from mock import mock_generate_cr
from schemas import CRAction, MeetingCR, TranscriptSegment

logger = logging.getLogger("ai-service.kimi")

# Integration best-effort avec l'API Chat Completions de Moonshot AI (Kimi K3,
# compatible OpenAI). Verifier le contrat exact et l'identifiant de modele exact
# sur https://platform.kimi.ai (redirection depuis platform.moonshot.ai) au
# moment de l'usage. Bascule automatique sur le mock si la cle est absente ou
# si l'appel echoue.
#
# Point ouvert a trancher en equipe, non resolu par ce commit : Kimi K3 est un
# modele Moonshot AI (Chine), non heberge en UE - ca contredit l'argumentaire
# "stack souveraine" ecrit pour Mistral/Gladia. Idealement, ce client devrait
# taper une infra UE (auto-hebergement ou hebergeur type OVHcloud/Scaleway) une
# fois disponible. Voir Stack_Technique_Souveraine.md section 5.5 et
# Analyse_RGPD_Ethique_IA.md avant un passage en production.
#
# Portage de lib/kimi.ts (ex-integration Node) vers ce service FastAPI.

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
                    config.KIMI_URL,
                    headers={
                        "Authorization": f"Bearer {config.MOONSHOT_API_KEY}",
                        "Content-Type": "application/json",
                    },
                    json=payload,
                )
        except (httpx.TimeoutException, httpx.TransportError) as err:
            last_err = err
            if attempt < len(RETRY_DELAYS_SECONDS):
                logger.warning(
                    "[kimi] erreur reseau, retry %d/%d: %s",
                    attempt + 1, len(RETRY_DELAYS_SECONDS), err,
                )
                continue
            raise

        if res.status_code == 429 or res.status_code >= 500:
            last_err = RuntimeError(f"Kimi K3 API transient error: {res.status_code}")
            if attempt < len(RETRY_DELAYS_SECONDS):
                logger.warning(
                    "[kimi] erreur transitoire %s, retry %d/%d",
                    res.status_code, attempt + 1, len(RETRY_DELAYS_SECONDS),
                )
                continue
            raise last_err

        if res.status_code >= 400:
            raise RuntimeError(f"Kimi K3 API error: {res.status_code}")

        return res

    raise last_err  # pragma: no cover - inatteignable, la boucle retourne ou leve avant


async def generate_cr(transcript: list[TranscriptSegment]) -> tuple[MeetingCR, str]:
    if not config.MOONSHOT_API_KEY:
        return await mock_generate_cr(transcript), "mock"

    try:
        transcript_text = "\n".join(f"{s.speaker}: {s.text}" for s in transcript)

        res = await _post_with_retry({
            "model": "kimi-k3",
            "response_format": {"type": "json_object"},
            "messages": [
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": f"Voici la transcription:\n\n{transcript_text}"},
            ],
        })

        body = res.json()
        content = body.get("choices", [{}])[0].get("message", {}).get("content")
        if not content:
            raise RuntimeError("empty response from Kimi K3")

        parsed = json.loads(content)
        cr = MeetingCR(
            resume=parsed.get("resume", ""),
            decisions=parsed.get("decisions", []),
            actions=[CRAction(**a) for a in parsed.get("actions", [])],
            themes=parsed.get("themes", []),
        )
        return cr, "real"
    except Exception as err:  # noqa: BLE001 - filet de securite volontaire
        logger.error("[kimi] fallback to mock: %s", err)
        return await mock_generate_cr(transcript), "mock"
