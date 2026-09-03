import asyncio
import json
import logging

import httpx

import config
from clients import scaleway
from schemas import CRAction, MeetingCR

logger = logging.getLogger("ai-service.translator")

# Traduit un CR deja genere (jamais l'audio/transcript) vers l'anglais - la
# generation elle-meme force toujours le francais (cf. SYSTEM_PROMPT dans
# clients/mistral_cr.py), donc "traduire" ne veut dire qu'une seule chose ici.
# Seuls resume/decisions/themes/actions[].text partent au modele : owner (nom
# de personne), priority et done ne doivent jamais etre traduits ni
# reformules par le modele, donc ils ne quittent jamais ce module - on les
# recolle localement apres coup (_rebuild).
#
# Si Mistral et Scaleway echouent tous les deux (ou ne sont pas configures),
# on renvoie le CR original tel quel plutot qu'un contenu invente :
# contrairement a mock_generate_cr (qui comble une absence totale de
# contenu), un vrai CR correct existe deja ici en francais - le montrer non
# traduit est strictement moins trompeur qu'un faux contenu anglais
# generique sans rapport avec la reunion.

SYSTEM_PROMPT = (
    "Tu traduis un compte-rendu de reunion du francais vers l'anglais. Reponds "
    "uniquement en JSON avec les cles: resume (string), decisions (array de "
    "string), actionTexts (array de string), themes (array de string) - "
    "meme nombre d'elements et meme ordre que dans le texte fourni pour "
    "decisions, actionTexts et themes. Ne traduis aucun nom propre."
)

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
                    "[translator] erreur reseau, retry %d/%d: %s",
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
                    "[translator] erreur transitoire %s, retry %d/%d",
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


def _parse_translation(res: httpx.Response) -> dict:
    body = res.json()
    content = body.get("choices", [{}])[0].get("message", {}).get("content")
    if not content:
        raise RuntimeError("empty response from chat API")
    return json.loads(content)


def _rebuild(cr: MeetingCR, translated: dict) -> MeetingCR:
    decisions = translated.get("decisions")
    themes = translated.get("themes")
    action_texts = translated.get("actionTexts")

    actions = [
        CRAction(
            text=action_texts[i] if action_texts and i < len(action_texts) else a.text,
            owner=a.owner,
            priority=a.priority,
            done=a.done,
        )
        for i, a in enumerate(cr.actions)
    ]

    return MeetingCR(
        resume=translated.get("resume") or cr.resume,
        decisions=decisions if decisions and len(decisions) == len(cr.decisions) else cr.decisions,
        actions=actions,
        themes=themes if themes and len(themes) == len(cr.themes) else cr.themes,
    )


async def translate_cr(cr: MeetingCR, target_locale: str) -> tuple[MeetingCR, str]:
    """Traduit un CR vers `target_locale`. Retourne (cr_traduit, source) avec
    source = "real" (traduit) ou "mock" (echec/non configure - CR original
    renvoye tel quel, voir note en tete de fichier)."""
    if target_locale != "en":
        return cr, "real"

    payload = {
        "model": config.MISTRAL_CHAT_MODEL,
        "response_format": {"type": "json_object"},
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {
                "role": "user",
                "content": json.dumps(
                    {
                        "resume": cr.resume,
                        "decisions": cr.decisions,
                        "actionTexts": [a.text for a in cr.actions],
                        "themes": cr.themes,
                    }
                ),
            },
        ],
    }

    if config.MISTRAL_API_KEY:
        try:
            res = await _post_with_retry(payload)
            return _rebuild(cr, _parse_translation(res)), "real"
        except Exception as err:  # noqa: BLE001 - filet de securite volontaire
            logger.error(
                "[translator] Mistral indisponible, tentative sous-traitant de secours: %s", err
            )

    if config.SCALEWAY_API_KEY:
        try:
            res = await scaleway.post_chat_with_retry(payload)
            return _rebuild(cr, _parse_translation(res)), "real"
        except Exception as err:  # noqa: BLE001 - filet de securite volontaire
            logger.error("[translator] sous-traitant de secours egalement en echec: %s", err)

    return cr, "mock"
