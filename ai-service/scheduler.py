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
    scheduler.add_job(
        purge_expired_meetings,
        "interval",
        minutes=config.RGPD_PURGE_INTERVAL_MINUTES,
        id="rgpd_purge",
        replace_existing=True,
    )
    scheduler.start()


async def purge_expired_meetings() -> None:
    """Anonymise les reunions dont la duree de conservation (retention_days) est depassee.

    Politique de retention documentee dans rapport_technique.md section 5 : la
    purge doit etre automatique, pas seulement une valeur affichee en UI. Reutilise
    la meme anonymisation que la suppression manuelle organisateur (routers/meetings.py) :
    transcript/cr/moderation/classification effaces, titre remplace, statut inchange.
    """
    db = SessionLocal()
    try:
        purged = _purge_expired_meetings(db)
        if purged:
            logger.info(
                "[scheduler] rgpd purge: %d reunion(s) anonymisee(s) (retention_days depasse)",
                purged,
            )
    finally:
        db.close()


def _purge_expired_meetings(db) -> int:
    """Anonymise en base les reunions expirees et renvoie le nombre traite.

    Isolee de ``purge_expired_meetings`` (qui gere le cycle de vie de la
    session) pour rester testable avec une session SQLAlchemy quelconque.
    """
    now = datetime.now(timezone.utc)
    # Filtre uniquement sur `status` (colonne simple) : la colonne JSON
    # `transcript` stocke None comme le literal JSON 'null', pas un SQL NULL
    # (comportement par defaut de SQLAlchemy JSON), donc `.isnot(None)` ne
    # filtrerait pas correctement au niveau SQL. Le check "deja purgee" se
    # fait cote Python ci-dessous a la place.
    candidates = db.query(models.Meeting).filter(models.Meeting.status == "ready").all()

    purged = 0
    for meeting in candidates:
        if meeting.transcript is None:
            continue  # deja purgee, ou jamais eu de transcript

        # SQLite ne conserve pas le fuseau horaire : une valeur relue depuis
        # la DB revient "naive" meme si elle a ete ecrite avec tzinfo=utc
        # (cf. models._now). On la re-tague explicitement pour rester
        # comparable a `now`, sans dependre de l'horloge locale du process.
        meeting_date = (
            meeting.date if meeting.date.tzinfo else meeting.date.replace(tzinfo=timezone.utc)
        )
        expires_at = meeting_date + timedelta(days=meeting.retention_days)
        if expires_at > now:
            continue
        meeting.transcript = None
        meeting.cr = None
        meeting.moderation = None
        meeting.classification = None
        meeting.title = "[réunion expirée - durée de conservation dépassée]"
        purged += 1

    if purged:
        db.commit()
    return purged


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
            logger.error(
                "[scheduler] token refresh failed for connection=%s: %s", connection.id, err
            )
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
        .join(
            models.CalendarConnection,
            models.CalendarSyncedEvent.connection_id == models.CalendarConnection.id,
        )
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
