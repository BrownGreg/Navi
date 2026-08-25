import logging
import re

import httpx

import config

logger = logging.getLogger("ai-service.meeting_url")

# Resolution d'une URL de reunion (Meet/Zoom/Teams) en (platform, native_meeting_id).
# Utilise a la fois par le flux "coller un lien" (routers/visio.py) et par la
# synchronisation calendrier (scheduler.py).

MEET_RE = re.compile(r"meet\.google\.com/([a-z]{3,4}-[a-z]{3,4}-[a-z]{3,4})", re.IGNORECASE)
ZOOM_RE = re.compile(r"(?:[\w-]+\.)?zoom\.us/j/(\d+)", re.IGNORECASE)


def parse_meeting_url_local(url: str) -> tuple[str | None, str | None]:
    """Extraction regex locale, degradee mais independante de Vexa.

    Ne gere pas Teams : l'identifiant de reunion y est un chemin encode
    opaque (pas de format stable a parser fiablement par regex) - l'appelant
    doit alors retomber sur une saisie manuelle.
    """
    match = MEET_RE.search(url)
    if match:
        return "google_meet", match.group(1)

    match = ZOOM_RE.search(url)
    if match:
        return "zoom", match.group(1)

    return None, None


async def resolve_meeting_url(url: str) -> tuple[str | None, str | None]:
    """Resout une URL de reunion en (platform, native_meeting_id).

    Priorite a l'API Vexa (POST /meetings, parsing serveur-side documente sur
    docs.vexa.ai/api/meetings.md) qui couvre aussi Teams - avec repli sur le
    parsing local si Vexa est indisponible, non configure, ou si le contrat
    a derive (meme prudence que le commentaire de clients/vexa.py sur l'ecart
    de version 0.10/0.12 du cloud manage).
    """
    if not config.VEXA_API_KEY:
        return parse_meeting_url_local(url)

    try:
        headers = {"X-API-Key": config.VEXA_API_KEY, "Content-Type": "application/json"}
        body = {"meeting_url": url, "auto_join": False}
        async with httpx.AsyncClient(timeout=15) as client:
            res = await client.post(f"{config.VEXA_BASE_URL}/meetings", headers=headers, json=body)
        if res.status_code >= 400:
            raise RuntimeError(f"Vexa resolve error: {res.status_code} {res.text}")

        data = res.json()
        record = data.get("meeting", data)
        platform = record.get("platform")
        native_meeting_id = record.get("native_meeting_id")
        if platform and native_meeting_id:
            return platform, native_meeting_id
        raise RuntimeError("Vexa resolve: champs platform/native_meeting_id absents")
    except Exception as err:  # noqa: BLE001 - filet de securite, meme esprit que clients/vexa.py
        logger.error("[meeting_url] resolve via Vexa fallback: %s", err)
        return parse_meeting_url_local(url)
