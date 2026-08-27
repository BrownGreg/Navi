import logging
from datetime import datetime, timedelta, timezone
from urllib.parse import urlencode

import httpx

import config
from clients.calendar_types import CalendarEvent, TokenSet
from clients.meeting_url import parse_meeting_url_local

logger = logging.getLogger("ai-service.google_calendar")

AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
TOKEN_URL = "https://oauth2.googleapis.com/token"
USERINFO_URL = "https://www.googleapis.com/oauth2/v2/userinfo"
EVENTS_URL = "https://www.googleapis.com/calendar/v3/events"
REVOKE_URL = "https://oauth2.googleapis.com/revoke"

SCOPES = "openid email https://www.googleapis.com/auth/calendar.readonly"


def build_authorize_url(state: str) -> str:
    params = {
        "client_id": config.GOOGLE_CLIENT_ID,
        "redirect_uri": config.GOOGLE_REDIRECT_URI,
        "response_type": "code",
        "scope": SCOPES,
        "access_type": "offline",
        # Force le renvoi d'un refresh_token meme si l'utilisateur a deja
        # consenti par le passe (Google ne le renvoie sinon qu'au tout
        # premier consentement).
        "prompt": "consent",
        "state": state,
    }
    return f"{AUTH_URL}?{urlencode(params)}"


async def _fetch_account_email(access_token: str) -> str | None:
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            res = await client.get(
                USERINFO_URL, headers={"Authorization": f"Bearer {access_token}"}
            )
        if res.status_code >= 400:
            return None
        return res.json().get("email")
    except Exception as err:  # noqa: BLE001 - best-effort, l'email n'est qu'indicatif
        logger.error("[google_calendar] userinfo failed: %s", err)
        return None


def _token_set_from_response(data: dict, fallback_refresh_token: str | None = None) -> TokenSet:
    expires_at = datetime.now(timezone.utc) + timedelta(seconds=data.get("expires_in", 3600))
    return TokenSet(
        access_token=data["access_token"],
        refresh_token=data.get("refresh_token") or fallback_refresh_token,
        expires_at=expires_at,
    )


async def exchange_code(code: str) -> TokenSet:
    body = {
        "code": code,
        "client_id": config.GOOGLE_CLIENT_ID,
        "client_secret": config.GOOGLE_CLIENT_SECRET,
        "redirect_uri": config.GOOGLE_REDIRECT_URI,
        "grant_type": "authorization_code",
    }
    async with httpx.AsyncClient(timeout=15) as client:
        res = await client.post(TOKEN_URL, data=body)
    if res.status_code >= 400:
        raise RuntimeError(f"Google token exchange error: {res.status_code} {res.text}")

    token_set = _token_set_from_response(res.json())
    token_set.account_email = await _fetch_account_email(token_set.access_token)
    return token_set


async def refresh_access_token(refresh_token: str) -> TokenSet:
    body = {
        "refresh_token": refresh_token,
        "client_id": config.GOOGLE_CLIENT_ID,
        "client_secret": config.GOOGLE_CLIENT_SECRET,
        "grant_type": "refresh_token",
    }
    async with httpx.AsyncClient(timeout=15) as client:
        res = await client.post(TOKEN_URL, data=body)
    if res.status_code >= 400:
        raise RuntimeError(f"Google token refresh error: {res.status_code} {res.text}")

    # Google n'inclut pas systematiquement refresh_token dans la reponse de
    # refresh : on garde l'ancien.
    return _token_set_from_response(res.json(), fallback_refresh_token=refresh_token)


def _extract_meeting_url(event: dict) -> str | None:
    for entry_point in event.get("conferenceData", {}).get("entryPoints", []):
        if entry_point.get("entryPointType") == "video" and entry_point.get("uri"):
            return entry_point["uri"]

    platform, _ = parse_meeting_url_local(event.get("location", ""))
    if platform:
        return event["location"]
    platform, _ = parse_meeting_url_local(event.get("description", ""))
    if platform:
        return event["description"]

    return None


async def list_upcoming_events(access_token: str, lookahead_minutes: int) -> list[CalendarEvent]:
    now = datetime.now(timezone.utc)
    params = {
        "calendarId": "primary",
        "timeMin": now.isoformat(),
        "timeMax": (now + timedelta(minutes=lookahead_minutes)).isoformat(),
        "singleEvents": "true",
        "orderBy": "startTime",
    }
    async with httpx.AsyncClient(timeout=15) as client:
        res = await client.get(
            EVENTS_URL, params=params, headers={"Authorization": f"Bearer {access_token}"}
        )
    if res.status_code >= 400:
        raise RuntimeError(f"Google events list error: {res.status_code} {res.text}")

    events: list[CalendarEvent] = []
    for item in res.json().get("items", []):
        start = item.get("start", {}).get("dateTime")
        if not start:
            continue  # evenement "journee entiere", pas d'heure de debut exploitable

        events.append(
            CalendarEvent(
                external_id=item["id"],
                title=item.get("summary") or "Reunion sans titre",
                start_time=datetime.fromisoformat(start),
                meeting_url=_extract_meeting_url(item),
            )
        )
    return events


async def revoke(access_token: str) -> None:
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            await client.post(REVOKE_URL, params={"token": access_token})
    except Exception as err:  # noqa: BLE001 - best-effort, la deconnexion locale reste valable
        logger.error("[google_calendar] revoke (best-effort) failed: %s", err)
