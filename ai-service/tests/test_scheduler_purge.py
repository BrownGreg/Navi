"""Tests de la purge RGPD automatique (scheduler._purge_expired_meetings).

La politique de retention (retention_days) etait jusqu'ici seulement une
valeur affichee en UI : ces tests couvrent l'anonymisation effective des
reunions expirees, cote base de donnees.
"""

from __future__ import annotations

from datetime import datetime, timedelta, timezone

import pytest
from sqlalchemy.orm import Session

import models
from scheduler import _purge_expired_meetings

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
