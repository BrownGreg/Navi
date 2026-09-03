"""Tests du plafond d'usage mensuel (crud.require_within_quota).

Couvre le calcul de cout reel (dictaphone vs visio, fenetre = mois calendaire
en cours) et son application sur /transcribe et /visio/join - voir
rapport_technique.md §4 et §8 pour le contexte (absence de plafond identifiee
comme le principal risque financier du plan Pro a prix fixe).
"""

from __future__ import annotations

import io
from datetime import datetime, timedelta, timezone
from unittest.mock import AsyncMock, patch

import pytest
from fastapi import HTTPException
from httpx import AsyncClient
from sqlalchemy.orm import Session

import config
import models
from crud import require_within_quota
from schemas import ModerateResponse, TranscriptSegment

_FAKE_SEGMENTS = [TranscriptSegment(speaker="Intervenant 1", text="Bonjour.", start=0.0, end=1.0)]
_FAKE_MODERATION = ModerateResponse(flagged=False, source="mock")
_DUMMY_AUDIO = b"\xff\xfb\x90\x00" * 16


def _month_start() -> datetime:
    return datetime.now(timezone.utc).replace(day=1, hour=0, minute=0, second=0, microsecond=0)


def _seed_meeting(
    db_session: Session,
    owner_id: str,
    *,
    mode: str,
    duration_min: int,
    date: datetime | None = None,
) -> models.Meeting:
    meeting = models.Meeting(
        owner_id=owner_id,
        title="Reunion existante",
        mode=mode,
        duration_min=duration_min,
        date=date or datetime.now(timezone.utc),
        status="ready",
    )
    db_session.add(meeting)
    db_session.commit()
    db_session.refresh(meeting)
    return meeting


def _make_user(db_session: Session, email: str) -> models.User:
    user = models.User(email=email, password_hash="x")
    db_session.add(user)
    db_session.commit()
    return user


class TestRequireWithinQuotaUnit:
    """Tests directs de crud.require_within_quota (cout, fenetre mensuelle)."""

    def test_allows_first_use(self, db_session: Session) -> None:
        user = _make_user(db_session, "quota-u1@example.com")
        require_within_quota(db_session, user.id, "dictaphone", additional_minutes=30)

    def test_rejects_over_cap_dictaphone(self, db_session: Session) -> None:
        user = _make_user(db_session, "quota-u2@example.com")
        cap_minutes = config.MONTHLY_USAGE_CAP_USD / config.VOXTRAL_COST_PER_MINUTE_USD

        with pytest.raises(HTTPException) as exc_info:
            require_within_quota(
                db_session, user.id, "dictaphone", additional_minutes=cap_minutes + 1
            )
        assert exc_info.value.status_code == 402

    def test_rejects_over_cap_visio(self, db_session: Session) -> None:
        user = _make_user(db_session, "quota-u3@example.com")
        cap_hours = config.MONTHLY_USAGE_CAP_USD / config.VEXA_COST_PER_HOUR_USD
        _seed_meeting(db_session, user.id, mode="visio", duration_min=int((cap_hours + 1) * 60))

        with pytest.raises(HTTPException) as exc_info:
            require_within_quota(db_session, user.id, "visio")
        assert exc_info.value.status_code == 402

    def test_exactly_at_cap_is_allowed(self, db_session: Session) -> None:
        """Le plafond rejette au-dela, pas a l'egalite (>strict, pas >=)."""
        user = _make_user(db_session, "quota-u4@example.com")
        cap_minutes = config.MONTHLY_USAGE_CAP_USD / config.VOXTRAL_COST_PER_MINUTE_USD
        _seed_meeting(db_session, user.id, mode="dictaphone", duration_min=int(cap_minutes))

        require_within_quota(db_session, user.id, "dictaphone", additional_minutes=0)

    def test_mixed_mode_accumulates_by_real_cost(self, db_session: Session) -> None:
        """Dictaphone et visio n'ont pas le meme cout/heure : le cumul doit
        ponderer par mode, pas juste additionner des minutes brutes."""
        user = _make_user(db_session, "quota-u5@example.com")
        # 20h dictaphone (20*60*$0.006 = $7.2) + 20h visio (20*$0.50 = $10) = $17.2
        _seed_meeting(db_session, user.id, mode="dictaphone", duration_min=20 * 60)
        _seed_meeting(db_session, user.id, mode="visio", duration_min=20 * 60)

        # Sous le plafond ($21) : ok
        require_within_quota(db_session, user.id, "dictaphone", additional_minutes=0)

        # +10h visio ($5) ferait $22.2 > $21 : rejete
        _seed_meeting(db_session, user.id, mode="visio", duration_min=10 * 60)
        with pytest.raises(HTTPException):
            require_within_quota(db_session, user.id, "visio", additional_minutes=0)

    def test_previous_month_usage_is_excluded(self, db_session: Session) -> None:
        """La fenetre est le mois calendaire en cours : un usage massif le
        mois dernier ne doit pas bloquer le mois en cours (reset mensuel)."""
        user = _make_user(db_session, "quota-u6@example.com")
        last_month_date = _month_start() - timedelta(days=1)
        # 100h de visio le mois dernier ($50, tres au-dessus du plafond)
        _seed_meeting(
            db_session, user.id, mode="visio", duration_min=100 * 60, date=last_month_date
        )

        require_within_quota(db_session, user.id, "visio", additional_minutes=0)


class TestTranscribeQuotaGate:
    """Application du plafond sur POST /api/transcribe (dictaphone)."""

    pytestmark = pytest.mark.asyncio

    @patch("routers.transcribe.run_moderation", new_callable=AsyncMock)
    @patch("routers.transcribe.transcribe_audio", new_callable=AsyncMock)
    async def test_transcribe_over_quota_returns_402(
        self,
        mock_transcribe: AsyncMock,
        mock_moderate: AsyncMock,
        client: AsyncClient,
        auth_headers: dict[str, str],
        consented_meeting: models.Meeting,
        db_session: Session,
    ) -> None:
        mock_transcribe.return_value = (_FAKE_SEGMENTS, "mock")
        mock_moderate.return_value = _FAKE_MODERATION

        cap_minutes = config.MONTHLY_USAGE_CAP_USD / config.VOXTRAL_COST_PER_MINUTE_USD
        _seed_meeting(
            db_session, consented_meeting.owner_id, mode="dictaphone", duration_min=int(cap_minutes)
        )

        resp = await client.post(
            "/api/transcribe",
            data={"meetingId": consented_meeting.id, "durationSec": "600"},
            files={"audio": ("test.webm", io.BytesIO(_DUMMY_AUDIO), "audio/webm")},
            headers=auth_headers,
        )

        assert resp.status_code == 402
        mock_transcribe.assert_not_called()

    @patch("routers.transcribe.run_moderation", new_callable=AsyncMock)
    @patch("routers.transcribe.transcribe_audio", new_callable=AsyncMock)
    async def test_transcribe_under_quota_succeeds(
        self,
        mock_transcribe: AsyncMock,
        mock_moderate: AsyncMock,
        client: AsyncClient,
        auth_headers: dict[str, str],
        consented_meeting: models.Meeting,
    ) -> None:
        mock_transcribe.return_value = (_FAKE_SEGMENTS, "mock")
        mock_moderate.return_value = _FAKE_MODERATION

        resp = await client.post(
            "/api/transcribe",
            data={"meetingId": consented_meeting.id, "durationSec": "120"},
            files={"audio": ("test.webm", io.BytesIO(_DUMMY_AUDIO), "audio/webm")},
            headers=auth_headers,
        )

        assert resp.status_code == 200
        mock_transcribe.assert_called_once()


class TestVisioJoinQuotaGate:
    """Application du plafond sur POST /api/visio/join (partage avec l'auto-join
    calendrier via services.visio_join.join_meeting - voir crud.require_within_quota)."""

    pytestmark = pytest.mark.asyncio

    @patch("services.visio_join.join_bot", new_callable=AsyncMock)
    async def test_join_over_quota_returns_402(
        self,
        mock_join_bot: AsyncMock,
        client: AsyncClient,
        auth_headers: dict[str, str],
        consented_meeting: models.Meeting,
        db_session: Session,
    ) -> None:
        cap_hours = config.MONTHLY_USAGE_CAP_USD / config.VEXA_COST_PER_HOUR_USD
        _seed_meeting(
            db_session,
            consented_meeting.owner_id,
            mode="visio",
            duration_min=int((cap_hours + 1) * 60),
        )

        resp = await client.post(
            "/api/visio/join",
            json={
                "meetingId": consented_meeting.id,
                "platform": "google_meet",
                "nativeMeetingId": "abc-defg-hij",
            },
            headers=auth_headers,
        )

        assert resp.status_code == 402
        mock_join_bot.assert_not_called()

    @patch("services.visio_join.join_bot", new_callable=AsyncMock)
    async def test_join_under_quota_succeeds(
        self,
        mock_join_bot: AsyncMock,
        client: AsyncClient,
        auth_headers: dict[str, str],
        consented_meeting: models.Meeting,
    ) -> None:
        mock_join_bot.return_value = (True, "real")

        resp = await client.post(
            "/api/visio/join",
            json={
                "meetingId": consented_meeting.id,
                "platform": "google_meet",
                "nativeMeetingId": "abc-defg-hij",
            },
            headers=auth_headers,
        )

        assert resp.status_code == 200
        assert resp.json()["joined"] is True
        mock_join_bot.assert_called_once()
