"""Tests de la purge RGPD automatique (scheduler._purge_expired_meetings et
scheduler._purge_expired_consent_records / _purge_expired_participant_notifications).

La politique de retention (retention_days) etait jusqu'ici seulement une
valeur affichee en UI : ces tests couvrent l'anonymisation effective des
reunions expirees, cote base de donnees - et, separement, la suppression des
preuves de conformite (ConsentRecord, ParticipantNotification) une fois leur
propre duree de conservation depassee, jamais avant que la reunion couverte
n'ait elle-meme ete anonymisee.
"""

from __future__ import annotations

from datetime import datetime, timedelta, timezone
from unittest.mock import patch

import pytest
from sqlalchemy.orm import Session

import models
from scheduler import (
    _purge_expired_consent_records,
    _purge_expired_meetings,
    _purge_expired_participant_notifications,
)

pytestmark = pytest.mark.asyncio


def _make_meeting(db_session: Session, *, age_days: int, retention_days: int) -> models.Meeting:
    user = models.User(email=f"user-{age_days}-{retention_days}@example.com", password_hash="x")
    db_session.add(user)
    db_session.flush()

    meeting = models.Meeting(
        owner_id=user.id,
        title="Reunion originale",
        mode="dictaphone",
        date=datetime.now(timezone.utc) - timedelta(days=age_days),
        retention_days=retention_days,
        status="ready",
        transcript=[{"speaker": "Intervenant 1", "text": "bonjour", "start": 0, "end": 1}],
        cr={"resume": "resume", "decisions": [], "actions": [], "themes": []},
        moderation={"flagged": False},
        classification={"tone": "neutre", "urgency": "normale", "themes": [], "perSegment": []},
    )
    db_session.add(meeting)
    db_session.commit()
    db_session.refresh(meeting)
    return meeting


class TestPurgeExpiredMeetings:
    async def test_expired_meeting_is_anonymized(self, db_session: Session) -> None:
        meeting = _make_meeting(db_session, age_days=31, retention_days=30)

        purged = _purge_expired_meetings(db_session)

        db_session.refresh(meeting)
        assert purged == 1
        assert meeting.transcript is None
        assert meeting.cr is None
        assert meeting.moderation is None
        assert meeting.classification is None
        assert meeting.title == "[réunion expirée - durée de conservation dépassée]"

    async def test_meeting_within_retention_is_untouched(self, db_session: Session) -> None:
        meeting = _make_meeting(db_session, age_days=5, retention_days=30)

        purged = _purge_expired_meetings(db_session)

        db_session.refresh(meeting)
        assert purged == 0
        assert meeting.transcript is not None
        assert meeting.title == "Reunion originale"

    async def test_meeting_without_transcript_is_ignored(self, db_session: Session) -> None:
        user = models.User(email="empty@example.com", password_hash="x")
        db_session.add(user)
        db_session.flush()
        meeting = models.Meeting(
            owner_id=user.id,
            title="Reunion en cours",
            mode="dictaphone",
            date=datetime.now(timezone.utc) - timedelta(days=999),
            retention_days=30,
            status="processing",
        )
        db_session.add(meeting)
        db_session.commit()

        purged = _purge_expired_meetings(db_session)

        assert purged == 0

    async def test_purge_is_idempotent_on_second_run(self, db_session: Session) -> None:
        _make_meeting(db_session, age_days=31, retention_days=30)

        first = _purge_expired_meetings(db_session)
        second = _purge_expired_meetings(db_session)

        assert first == 1
        assert second == 0


def _make_consent_record(
    db_session: Session, meeting: models.Meeting, *, age_days: int
) -> models.ConsentRecord:
    record = models.ConsentRecord(
        meeting_id=meeting.id,
        user_id=meeting.owner_id,
        consent_type="oral_recording",
        granted_at=datetime.now(timezone.utc) - timedelta(days=age_days),
        consent_text_version="v1",
    )
    db_session.add(record)
    db_session.commit()
    db_session.refresh(record)
    return record


def _make_participant_notification(
    db_session: Session, meeting: models.Meeting, *, age_days: int
) -> models.ParticipantNotification:
    notification = models.ParticipantNotification(
        meeting_id=meeting.id,
        channel="vexa_bot_display_name",
        sent_at=datetime.now(timezone.utc) - timedelta(days=age_days),
    )
    db_session.add(notification)
    db_session.commit()
    db_session.refresh(notification)
    return notification


class TestPurgeExpiredConsentRecords:
    """CONSENT_RECORD_RETENTION_DAYS est patchee a 30 jours dans ces tests
    pour rester rapide, independamment de la vraie valeur par defaut (5 ans)."""

    async def test_consent_of_anonymized_meeting_is_deleted_after_retention(
        self, db_session: Session
    ) -> None:
        meeting = _make_meeting(db_session, age_days=999, retention_days=30)
        meeting.transcript = None  # simule une reunion deja anonymisee
        db_session.commit()
        _make_consent_record(db_session, meeting, age_days=31)

        with patch("config.CONSENT_RECORD_RETENTION_DAYS", 30):
            purged = _purge_expired_consent_records(db_session)

        assert purged == 1
        remaining = (
            db_session.query(models.ConsentRecord)
            .filter(models.ConsentRecord.meeting_id == meeting.id)
            .count()
        )
        assert remaining == 0

    async def test_consent_within_retention_is_untouched(self, db_session: Session) -> None:
        meeting = _make_meeting(db_session, age_days=999, retention_days=30)
        meeting.transcript = None
        db_session.commit()
        _make_consent_record(db_session, meeting, age_days=5)

        with patch("config.CONSENT_RECORD_RETENTION_DAYS", 30):
            purged = _purge_expired_consent_records(db_session)

        assert purged == 0

    async def test_consent_of_non_anonymized_meeting_is_never_deleted(
        self, db_session: Session
    ) -> None:
        """Critere d'acceptation cle : meme avec une preuve tres ancienne, on
        ne supprime jamais tant que la reunion n'a pas ete anonymisee -
        l'ordre inverse (perdre la preuve avant le contenu) n'a pas de sens.
        """
        meeting = _make_meeting(db_session, age_days=999, retention_days=30)
        assert meeting.transcript is not None  # pas encore anonymisee
        _make_consent_record(db_session, meeting, age_days=9999)

        with patch("config.CONSENT_RECORD_RETENTION_DAYS", 1):
            purged = _purge_expired_consent_records(db_session)

        assert purged == 0
        remaining = (
            db_session.query(models.ConsentRecord)
            .filter(models.ConsentRecord.meeting_id == meeting.id)
            .count()
        )
        assert remaining == 1


class TestPurgeExpiredParticipantNotifications:
    """Meme regle d'ordre que pour ConsentRecord, appliquee separement a
    ParticipantNotification (sa propre constante de duree)."""

    async def test_notification_of_anonymized_meeting_is_deleted_after_retention(
        self, db_session: Session
    ) -> None:
        meeting = _make_meeting(db_session, age_days=999, retention_days=30)
        meeting.transcript = None
        db_session.commit()
        _make_participant_notification(db_session, meeting, age_days=31)

        with patch("config.PARTICIPANT_NOTIFICATION_RETENTION_DAYS", 30):
            purged = _purge_expired_participant_notifications(db_session)

        assert purged == 1

    async def test_notification_of_non_anonymized_meeting_is_never_deleted(
        self, db_session: Session
    ) -> None:
        meeting = _make_meeting(db_session, age_days=999, retention_days=30)
        assert meeting.transcript is not None
        _make_participant_notification(db_session, meeting, age_days=9999)

        with patch("config.PARTICIPANT_NOTIFICATION_RETENTION_DAYS", 1):
            purged = _purge_expired_participant_notifications(db_session)

        assert purged == 0
