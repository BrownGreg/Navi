"""Tests du flux de consentement RGPD (organisateur + participants).

Couvre :
- POST /meetings/{id}/consent : persistance des ConsentRecord.
- Le blocage serveur de /visio/join sans consentement prealable (le
  blocage de /transcribe est teste dans test_transcribe.py, au plus pres
  du reste de la suite dictaphone).
- Le nom par defaut du bot Vexa et la journalisation ParticipantNotification.
- POST /rgpd-request declenche depuis le contexte "participant sans compte".
"""

from __future__ import annotations

from unittest.mock import AsyncMock, patch

import pytest
from httpx import AsyncClient
from sqlalchemy.orm import Session

import models

pytestmark = pytest.mark.asyncio


class TestGrantConsent:
    """Tests de POST /api/meetings/{id}/consent."""

    async def test_grant_consent_persists_records(
        self,
        client: AsyncClient,
        auth_headers: dict[str, str],
        test_meeting: models.Meeting,
        db_session: Session,
    ) -> None:
        resp = await client.post(
            f"/api/meetings/{test_meeting.id}/consent",
            json={"consentTypes": ["oral_recording", "transcript"], "textVersion": "v1"},
            headers=auth_headers,
        )

        assert resp.status_code == 200
        data = resp.json()
        assert len(data) == 2
        assert {r["consentType"] for r in data} == {"oral_recording", "transcript"}
        assert all(r["grantedAt"] for r in data)

        records = (
            db_session.query(models.ConsentRecord)
            .filter(models.ConsentRecord.meeting_id == test_meeting.id)
            .all()
        )
        assert len(records) == 2

    async def test_grant_consent_without_auth_returns_401(
        self,
        client: AsyncClient,
        test_meeting: models.Meeting,
    ) -> None:
        saved_cookies = dict(client.cookies)
        client.cookies.clear()
        try:
            resp = await client.post(
                f"/api/meetings/{test_meeting.id}/consent",
                json={"consentTypes": ["oral_recording"]},
            )
            assert resp.status_code == 401
        finally:
            client.cookies.update(saved_cookies)

    async def test_grant_consent_on_foreign_meeting_returns_404(
        self,
        client: AsyncClient,
        auth_headers: dict[str, str],
        test_meeting: models.Meeting,
    ) -> None:
        """Un autre utilisateur ne peut pas deposer un consentement sur cette reunion."""
        signup2 = await client.post(
            "/api/auth/signup",
            json={"email": "autre@example.com", "password": "password123"},
        )
        assert signup2.status_code == 200
        other_cookie = signup2.cookies.get("navi_session")
        other_headers = {"Cookie": f"navi_session={other_cookie}"}

        resp = await client.post(
            f"/api/meetings/{test_meeting.id}/consent",
            json={"consentTypes": ["oral_recording"]},
            headers=other_headers,
        )
        assert resp.status_code == 404


class TestVisioJoinConsentGate:
    """Verifie que /visio/join respecte le meme blocage serveur que /transcribe."""

    @patch("services.visio_join.join_bot", new_callable=AsyncMock)
    async def test_join_without_consent_returns_403(
        self,
        mock_join_bot: AsyncMock,
        client: AsyncClient,
        auth_headers: dict[str, str],
        test_meeting: models.Meeting,
    ) -> None:
        resp = await client.post(
            "/api/visio/join",
            json={
                "meetingId": test_meeting.id,
                "platform": "google_meet",
                "nativeMeetingId": "abc-defg-hij",
            },
            headers=auth_headers,
        )

        assert resp.status_code == 403
        mock_join_bot.assert_not_called()

    @patch("services.visio_join.join_bot", new_callable=AsyncMock)
    async def test_join_with_only_dictaphone_consent_returns_403(
        self,
        mock_join_bot: AsyncMock,
        client: AsyncClient,
        auth_headers: dict[str, str],
        test_meeting: models.Meeting,
    ) -> None:
        """Le visio affiche 4 cases (pas 2) : oral_recording+transcript seuls
        ne suffisent pas a rejoindre, contrairement au dictaphone."""
        grant_resp = await client.post(
            f"/api/meetings/{test_meeting.id}/consent",
            json={"consentTypes": ["oral_recording", "transcript"]},
            headers=auth_headers,
        )
        assert grant_resp.status_code == 200

        resp = await client.post(
            "/api/visio/join",
            json={
                "meetingId": test_meeting.id,
                "platform": "google_meet",
                "nativeMeetingId": "abc-defg-hij",
            },
            headers=auth_headers,
        )

        assert resp.status_code == 403
        mock_join_bot.assert_not_called()

    @patch("services.visio_join.join_bot", new_callable=AsyncMock)
    async def test_join_with_consent_succeeds(
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


class TestBotNameAndNotificationLog:
    """Verifie le nom par defaut du bot et la journalisation ParticipantNotification."""

    @patch("services.visio_join.join_bot", new_callable=AsyncMock)
    async def test_default_bot_name_used_when_not_provided(
        self,
        mock_join_bot: AsyncMock,
        client: AsyncClient,
        auth_headers: dict[str, str],
        consented_meeting: models.Meeting,
    ) -> None:
        mock_join_bot.return_value = (True, "real")

        await client.post(
            "/api/visio/join",
            json={
                "meetingId": consented_meeting.id,
                "platform": "google_meet",
                "nativeMeetingId": "abc-defg-hij",
            },
            headers=auth_headers,
        )

        called_args = mock_join_bot.call_args[0]
        assert called_args[2] == "Navi Notetaker — enregistrement"

    @patch("services.visio_join.join_bot", new_callable=AsyncMock)
    async def test_custom_bot_name_is_respected(
        self,
        mock_join_bot: AsyncMock,
        client: AsyncClient,
        auth_headers: dict[str, str],
        consented_meeting: models.Meeting,
    ) -> None:
        mock_join_bot.return_value = (True, "real")

        await client.post(
            "/api/visio/join",
            json={
                "meetingId": consented_meeting.id,
                "platform": "google_meet",
                "nativeMeetingId": "abc-defg-hij",
                "botName": "Bot perso",
            },
            headers=auth_headers,
        )

        called_args = mock_join_bot.call_args[0]
        assert called_args[2] == "Bot perso"

    @patch("services.visio_join.join_bot", new_callable=AsyncMock)
    async def test_real_join_logs_participant_notification(
        self,
        mock_join_bot: AsyncMock,
        client: AsyncClient,
        auth_headers: dict[str, str],
        consented_meeting: models.Meeting,
        db_session: Session,
    ) -> None:
        mock_join_bot.return_value = (True, "real")

        await client.post(
            "/api/visio/join",
            json={
                "meetingId": consented_meeting.id,
                "platform": "google_meet",
                "nativeMeetingId": "abc-defg-hij",
            },
            headers=auth_headers,
        )

        logs = (
            db_session.query(models.ParticipantNotification)
            .filter(models.ParticipantNotification.meeting_id == consented_meeting.id)
            .all()
        )
        assert len(logs) == 1
        assert logs[0].channel == "vexa_bot_display_name"
        assert logs[0].sent_at is not None

    @patch("services.visio_join.join_bot", new_callable=AsyncMock)
    async def test_mock_join_does_not_log_notification(
        self,
        mock_join_bot: AsyncMock,
        client: AsyncClient,
        auth_headers: dict[str, str],
        consented_meeting: models.Meeting,
        db_session: Session,
    ) -> None:
        """Une jointure en mode mock ne notifie personne pour de vrai : pas de trace."""
        mock_join_bot.return_value = (True, "mock")

        await client.post(
            "/api/visio/join",
            json={
                "meetingId": consented_meeting.id,
                "platform": "google_meet",
                "nativeMeetingId": "abc-defg-hij",
            },
            headers=auth_headers,
        )

        logs = (
            db_session.query(models.ParticipantNotification)
            .filter(models.ParticipantNotification.meeting_id == consented_meeting.id)
            .all()
        )
        assert len(logs) == 0


class TestParticipantRgpdRequest:
    """POST /rgpd-request depuis le contexte participant (deja teste dans
    test_rgpd.py pour le cas general ; ici on verifie specifiquement le
    contexte "participant sans compte, meetingId fourni")."""

    async def test_participant_can_submit_erasure_request(
        self,
        client: AsyncClient,
        test_meeting: models.Meeting,
    ) -> None:
        resp = await client.post(
            "/api/rgpd-request",
            json={
                "email": "participant@example.com",
                "meetingId": test_meeting.id,
                "type": "erasure",
            },
        )

        assert resp.status_code == 200
        data = resp.json()
        assert data["email"] == "participant@example.com"
        assert data["meetingId"] == test_meeting.id
        assert data["type"] == "erasure"
