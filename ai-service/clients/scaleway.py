import asyncio
import logging

import httpx

import config

logger = logging.getLogger("ai-service.scaleway")

# Sous-traitant de secours pour la generation du CR et la classification
# (clients/mistral_cr.py, clients/classifier.py) : n'est appele que si l'appel
# Mistral primaire a deja echoue. Scaleway (France, filiale d'Iliad) heberge
# mistral-small-3.2-24b-instruct-2506 sur sa propre infrastructure UE,
# totalement independante de celle de Mistral - une panne cote Mistral n'a
# aucune raison d'affecter Scaleway. API compatible OpenAI (memes formes de
# requete/reponse Chat Completions que Mistral), donc ce module ne fait que
# reenvoyer le meme payload avec le nom de modele et l'URL/cle Scaleway,
# plutot que dupliquer la logique de parsing (laissee aux appelants).
#
# Cf. config.py pour le choix de rester a deux sous-traitants maximum, tous
# deux en UE, plutot que d'en ajouter un troisieme.

RETRY_DELAYS_SECONDS = (1, 3)


async def post_chat_with_retry(payload: dict) -> httpx.Response:
    """Meme contrat que les _post_with_retry de mistral_cr.py/classifier.py,
    mais vers Scaleway : reutilise le payload Mistral (system/user messages,
    response_format) en forcant uniquement le champ "model" vers
    config.SCALEWAY_CHAT_MODEL avant l'envoi.

    Leve RuntimeError si SCALEWAY_API_KEY est absente : c'est a l'appelant de
    verifier la cle avant d'appeler cette fonction (meme convention que les
    autres clients), pour eviter une tentative reseau inutile.
    """
    if not config.SCALEWAY_API_KEY:
        raise RuntimeError("SCALEWAY_API_KEY absente")

    scaleway_payload = {**payload, "model": config.SCALEWAY_CHAT_MODEL}

    last_err: Exception | None = None
    for attempt, delay in enumerate((0, *RETRY_DELAYS_SECONDS)):
        if delay:
            await asyncio.sleep(delay)

        try:
            async with httpx.AsyncClient(timeout=60) as client:
                res = await client.post(
                    config.SCALEWAY_CHAT_URL,
                    headers={
                        "Authorization": f"Bearer {config.SCALEWAY_API_KEY}",
                        "Content-Type": "application/json",
                    },
                    json=scaleway_payload,
                )
        except (httpx.TimeoutException, httpx.TransportError) as err:
            last_err = err
            if attempt < len(RETRY_DELAYS_SECONDS):
                logger.warning(
                    "[scaleway] erreur reseau, retry %d/%d: %s",
                    attempt + 1,
                    len(RETRY_DELAYS_SECONDS),
                    err,
                )
                continue
            raise

        if res.status_code == 429 or res.status_code >= 500:
            last_err = RuntimeError(f"Scaleway chat API transient error: {res.status_code}")
            if attempt < len(RETRY_DELAYS_SECONDS):
                logger.warning(
                    "[scaleway] erreur transitoire %s, retry %d/%d",
                    res.status_code,
                    attempt + 1,
                    len(RETRY_DELAYS_SECONDS),
                )
                continue
            raise last_err

        if res.status_code >= 400:
            raise RuntimeError(f"Scaleway chat API error: {res.status_code}")

        return res

    raise last_err  # pragma: no cover - inatteignable, la boucle retourne ou leve avant
