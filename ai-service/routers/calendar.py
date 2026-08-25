from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session

import config
import models
from clients import google_calendar, microsoft_calendar
from db import get_db
from deps import get_current_user
from schemas import CalendarConnectionOut, CalendarProvider, UpcomingCalendarEventOut
from security import create_oauth_state, verify_oauth_state

router = APIRouter(prefix="/calendar", tags=["calendar"])

_PROVIDER_CLIENTS = {"google": google_calendar, "microsoft": microsoft_calendar}

# Origine publique du frontend Next.js, pour les redirections post-callback
# (l'utilisateur doit revenir sur une page servie derriere le rewrite /api/*,
# jamais sur ai-service directement - voir la note config.py sur les redirect URI).
_FRONTEND_ORIGIN = config.GOOGLE_REDIRECT_URI.rsplit("/api/calendar/", 1)[0]


def _client_for(provider: CalendarProvider):
    client = _PROVIDER_CLIENTS.get(provider)
    if client is None:
        raise HTTPException(status_code=404, detail="fournisseur inconnu")
    return client


@router.get("/status", response_model=list[CalendarConnectionOut])
def calendar_status(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[CalendarConnectionOut]:
    connections = {
        c.provider: c
        for c in db.query(models.CalendarConnection).filter(models.CalendarConnection.owner_id == current_user.id)
    }
    result = []
    for provider in _PROVIDER_CLIENTS:
        conn = connections.get(provider)
        result.append(
            CalendarConnectionOut(
                provider=provider,
                connected=conn is not None,
                account_email=conn.account_email if conn else None,
                needs_reauth=conn.needs_reauth if conn else False,
                connected_at=conn.created_at if conn else None,
            )
        )
    return result


@router.get("/{provider}/connect")
def calendar_connect(
    provider: CalendarProvider,
    current_user: models.User = Depends(get_current_user),
) -> RedirectResponse:
    client = _client_for(provider)
    state = create_oauth_state(current_user.id, provider)
    return RedirectResponse(client.build_authorize_url(state))


@router.get("/{provider}/callback")
async def calendar_callback(
    provider: CalendarProvider,
    code: str = Query(...),
    state: str = Query(...),
    db: Session = Depends(get_db),
) -> RedirectResponse:
    payload = verify_oauth_state(state)
    if not payload or payload["provider"] != provider:
        return RedirectResponse(f"{_FRONTEND_ORIGIN}/settings/calendar?error=state_invalide")

    client = _client_for(provider)
    try:
        token_set = await client.exchange_code(code)
    except Exception:
        return RedirectResponse(f"{_FRONTEND_ORIGIN}/settings/calendar?error=connexion_echouee")

    existing = (
        db.query(models.CalendarConnection)
        .filter(
            models.CalendarConnection.owner_id == payload["user_id"],
            models.CalendarConnection.provider == provider,
        )
        .first()
    )
    if existing:
        existing.access_token = token_set.access_token
        existing.refresh_token = token_set.refresh_token or existing.refresh_token
        existing.token_expires_at = token_set.expires_at
        existing.account_email = token_set.account_email or existing.account_email
        existing.needs_reauth = False
    else:
        db.add(
            models.CalendarConnection(
                owner_id=payload["user_id"],
                provider=provider,
                access_token=token_set.access_token,
                refresh_token=token_set.refresh_token or "",
                token_expires_at=token_set.expires_at,
                account_email=token_set.account_email,
            )
        )
    db.commit()

    return RedirectResponse(f"{_FRONTEND_ORIGIN}/settings/calendar?connected={provider}")


@router.post("/{provider}/disconnect")
async def calendar_disconnect(
    provider: CalendarProvider,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict[str, bool]:
    conn = (
        db.query(models.CalendarConnection)
        .filter(
            models.CalendarConnection.owner_id == current_user.id,
            models.CalendarConnection.provider == provider,
        )
        .first()
    )
    if not conn:
        return {"ok": True}

    if provider == "google":
        await google_calendar.revoke(conn.access_token)

    db.query(models.CalendarSyncedEvent).filter(
        models.CalendarSyncedEvent.connection_id == conn.id,
        models.CalendarSyncedEvent.status == "pending",
    ).delete()
    db.delete(conn)
    db.commit()

    return {"ok": True}


@router.get("/upcoming", response_model=list[UpcomingCalendarEventOut])
def calendar_upcoming(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[UpcomingCalendarEventOut]:
    horizon = datetime.now(timezone.utc) + timedelta(minutes=config.CALENDAR_LOOKAHEAD_MINUTES)
    rows = (
        db.query(models.CalendarSyncedEvent, models.CalendarConnection.provider)
        .join(models.CalendarConnection, models.CalendarSyncedEvent.connection_id == models.CalendarConnection.id)
        .filter(
            models.CalendarConnection.owner_id == current_user.id,
            models.CalendarSyncedEvent.status == "pending",
            models.CalendarSyncedEvent.start_time <= horizon,
        )
        .order_by(models.CalendarSyncedEvent.start_time)
        .all()
    )
    return [
        UpcomingCalendarEventOut(
            title=event.title,
            provider=provider,
            start_time=event.start_time,
            platform=event.platform,
        )
        for event, provider in rows
    ]
