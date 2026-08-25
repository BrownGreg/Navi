import logging
from datetime import datetime, timedelta, timezone
from urllib.parse import urlencode

import httpx

import config
from clients.calendar_types import CalendarEvent, TokenSet
from clients.meeting_url import parse_meeting_url_local

logger = logging.getLogger("ai-service.microsoft_calendar")

SCOPES = "offline_access openid email Calendars.Read"


def _authority() -> str:
    return f"https://login.microsoftonline.com/{config.MICROSOFT_TENANT_ID}"


def build_authorize_url(state: str) -> str:
    params = {
        "client_id": config.MICROSOFT_CLIENT_ID,
        "redirect_uri": config.MICROSOFT_REDIRECT_URI,
        "response_type": "code",
        "scope": SCOPES,
        "state": state,
    }
    return f"{_authority()}/oauth2/v2.0/authorize?{urlencode(params)}"


async def _fetch_account_email(access_token: str) -> str | None:
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            res = await client.get(
                "https://graph.microsoft.com/v1.0/me", headers={"Authorization": f"Bearer {access_token}"}
            )
        if res.status_code >= 400:
            return None
        data = res.json()
        return data.get("mail") or data.get("userPrincipalName")
    except Exception as err:  # noqa: BLE001 - best-effort, l'email n'est qu'indicatif
        logger.error("[microsoft_calendar] /me failed: %s", err)
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
        "client_id": config.MICROSOFT_CLIENT_ID,
        "client_secret": config.MICROSOFT_CLIENT_SECRET,
        "redirect_uri": config.MICROSOFT_REDIRECT_URI,
        "grant_type": "authorization_code",
        "scope": SCOPES,
    }
    async with httpx.AsyncClient(timeout=15) as client:
        res = await client.post(f"{_authority()}/oauth2/v2.0/token", data=body)
    if res.status_code >= 400:
        raise RuntimeError(f"Microsoft token exchange error: {res.status_code} {res.text}")

    token_set = _token_set_from_response(res.json())
    token_set.account_email = await _fetch_account_email(token_set.access_token)
    return token_set


async def refresh_access_token(refresh_token: str) -> TokenSet:
    body = {
        "refresh_token": refresh_token,
        "client_id": config.MICROSOFT_CLIENT_ID,
        "client_secret": config.MICROSOFT_CLIENT_SECRET,
        "grant_type": "refresh_token",
        "scope": SCOPES,
    }
    async with httpx.AsyncClient(timeout=15) as client:
        res = await client.post(f"{_authority()}/oauth2/v2.0/token", data=body)
    if res.status_code >= 400:
        raise RuntimeError(f"Microsoft token refresh error: {res.status_code} {res.text}")

    return _token_set_from_response(res.json(), fallback_refresh_token=refresh_token)


def _extract_meeting_url(event: dict) -> str | None:
    online_meeting = event.get("onlineMeeting") or {}
    if online_meeting.get("joinUrl"):
        return online_meeting["joinUrl"]

    location = (event.get("location") or {}).get("displayName", "")
    platform, _ = parse_meeting_url_local(location)
    if platform:
        return location

    body_preview = event.get("bodyPreview", "")
    platform, _ = parse_meeting_url_local(body_preview)
    if platform:
        return body_preview

    return None


async def list_upcoming_events(access_token: str, lookahead_minutes: int) -> list[CalendarEvent]:
    now = datetime.now(timezone.utc)
    params = {
        "startDateTime": now.isoformat(),
        "endDateTime": (now + timedelta(minutes=lookahead_minutes)).isoformat(),
    }
    headers = {
        "Authorization": f"Bearer {access_token}",
        "Prefer": 'outlook.timezone="UTC"',
    }
    async with httpx.AsyncClient(timeout=15) as client:
        res = await client.get(
            "https://graph.microsoft.com/v1.0/me/calendarview", params=params, headers=headers
        )
    if res.status_code >= 400:
        raise RuntimeError(f"Microsoft calendarview error: {res.status_code} {res.text}")

    events: list[CalendarEvent] = []
    for item in res.json().get("value", []):
        start_raw = item.get("start", {}).get("dateTime")
        if not start_raw:
            continue
        # Graph renvoie une heure UTC sans offset explicite (garanti par le
        # header Prefer ci-dessus) - on l'annote nous-memes.
        start_time = datetime.fromisoformat(start_raw).replace(tzinfo=timezone.utc)

        events.append(
            CalendarEvent(
                external_id=item["id"],
                title=item.get("subject") or "Reunion sans titre",
                start_time=start_time,
                meeting_url=_extract_meeting_url(item),
            )
        )
    return events
