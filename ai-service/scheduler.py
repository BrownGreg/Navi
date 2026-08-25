import logging
from datetime import datetime, timedelta, timezone

from apscheduler.schedulers.asyncio import AsyncIOScheduler

import config
import models
from clients import google_calendar, microsoft_calendar
from clients.meeting_url import resolve_meeting_url
from db import SessionLocal
from services.visio_join import join_meeting

logger = logging.getLogger("ai-service.scheduler")

_PROVIDER_CLIENTS = {"google": google_calendar, "microsoft": microsoft_calendar}

scheduler = AsyncIOScheduler()

# Marge avant expiration pour declencher un refresh preventif du token.
_TOKEN_REFRESH_MARGIN = timedelta(minutes=5)


def start_scheduler() -> None:
    scheduler.add_job(
        sync_and_join_calendars,
        "interval",
        minutes=config.CALENDAR_SYNC_INTERVAL_MINUTES,
        id="calendar_sync",
        replace_existing=True,
    )
    scheduler.start()


async def sync_and_join_calendars() -> None:
    db = SessionLocal()
    try:
        for connection in db.query(models.CalendarConnection).all():
            try:
                await _sync_one_connection(db, connection)
            except Exception as err:  # noqa: BLE001 - une connexion en erreur ne doit jamais bloquer les autres
                logger.error("[scheduler] sync failed for connection=%s: %s", connection.id, err)
                continue

        await _join_due_events(db)
    finally:
        db.close()


async def _sync_one_connection(db, connection: models.CalendarConnection) -> None:
    client = _PROVIDER_CLIENTS[connection.provider]

    access_token = connection.access_token
    if connection.token_expires_at <= datetime.now(timezone.utc) + _TOKEN_REFRESH_MARGIN:
        try:
            token_set = await client.refresh_access_token(connection.refresh_token)
        except Exception as err:  # noqa: BLE001 - refresh invalide : signaler, ne pas planter le tick
            logger.error("[scheduler] token refresh failed for connection=%s: %s", connection.id, err)
            connection.needs_reauth = True
            db.commit()
            return
        connection.access_token = token_set.access_token
        connection.refresh_token = token_set.refresh_token or connection.refresh_token
        connection.token_expires_at = token_set.expires_at
        connection.needs_reauth = False
        db.commit()
        access_token = connection.access_token

    events = await client.list_upcoming_events(access_token, config.CALENDAR_LOOKAHEAD_MINUTES)

    for event in events:
        if not event.meeting_url:
            continue  # pas de lien visio detecte sur cet evenement, rien a auto-joindre

        existing = (
            db.query(models.CalendarSyncedEvent)
            .filter(
                models.CalendarSyncedEvent.connection_id == connection.id,
                models.CalendarSyncedEvent.external_event_id == event.external_id,
            )
            .first()
        )
        if existing:
            if existing.status == "pending":
                existing.title = event.title
                existing.start_time = event.start_time
                db.commit()
            continue

        platform, native_meeting_id = await resolve_meeting_url(event.meeting_url)
        if not platform or not native_meeting_id:
            continue  # lien present mais non reconnu (ex: Teams sans cle Vexa) : pas d'auto-join possible

        db.add(
            models.CalendarSyncedEvent(
                connection_id=connection.id,
                external_event_id=event.external_id,
                title=event.title,
                start_time=event.start_time,
                platform=platform,
                native_meeting_id=native_meeting_id,
                status="pending",
            )
        )
        db.commit()


async def _join_due_events(db) -> None:
    now = datetime.now(timezone.utc)
    window_start = now - timedelta(seconds=config.CALENDAR_JOIN_GRACE_SECONDS)
    window_end = now + timedelta(seconds=config.CALENDAR_JOIN_LEAD_SECONDS)

    due_events = (
        db.query(models.CalendarSyncedEvent, models.CalendarConnection.owner_id)
        .join(models.CalendarConnection, models.CalendarSyncedEvent.connection_id == models.CalendarConnection.id)
        .filter(
            models.CalendarSyncedEvent.status == "pending",
            models.CalendarSyncedEvent.start_time >= window_start,
            models.CalendarSyncedEvent.start_time <= window_end,
        )
        .all()
    )

    for event, owner_id in due_events:
        # On revendique l'evenement avant de declencher le join, pour fermer
        # la fenetre de course si deux ticks du scheduler se chevauchent
        # (garde-fou suffisant en process unique, pas un verrou distribue).
        event.status = "joined"
        db.commit()

        try:
            meeting = models.Meeting(
                owner_id=owner_id,
                title=event.title,
                mode="visio",
            )
            db.add(meeting)
            db.commit()
            db.refresh(meeting)

            await join_meeting(db, meeting, event.platform, event.native_meeting_id)

            event.meeting_id = meeting.id
            event.joined_at = now
            db.commit()
        except Exception as err:  # noqa: BLE001 - un echec de join ne doit pas bloquer les autres evenements
            logger.error("[scheduler] auto-join failed for event=%s: %s", event.id, err)
            event.status = "failed"
            db.commit()
