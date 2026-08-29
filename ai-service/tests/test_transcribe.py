"""Tests du router /api/transcribe (transcription audio dictaphone).

Les clients IA réels (voxtral, moderation) sont mockés pour éviter toute
dépendance aux clés API. Les tests vérifient le code HTTP, la structure de
la réponse et la persistance du transcript en base.
"""

from __future__ import annotations

import io
from unittest.mock import AsyncMock, patch

import pytest
from httpx import AsyncClient
from sqlalchemy.orm import Session

import models
from schemas import ModerateResponse, TranscriptSegment

pytestmark = pytest.mark.asyncio

# ---------------------------------------------------------------------------
# Données de test réutilisables
# ---------------------------------------------------------------------------

_FAKE_SEGMENTS = [
    TranscriptSegment(speaker="Intervenant 1", text="Bonjour à tous.", start=0.0, end=2.5),
    TranscriptSegment(speaker="Intervenant 2", text="Bonjour, on commence.", start=3.0, end=5.0),
]

_FAKE_MODERATION = ModerateResponse(flagged=False, source="mock")

# Contenu audio minimal (octet vide simulé : OK pour les tests qui mockent voxtral)
_DUMMY_AUDIO = b"\xff\xfb\x90\x00" * 16  # 64 octets ressemblant à du MP3


class TestTranscribeDictaphone:
    """Tests de POST /api/transcribe."""

    @patch("routers.transcribe.run_moderation", new_callable=AsyncMock)
    @patch("routers.transcribe.transcribe_audio", new_callable=AsyncMock)
    async def test_transcribe_success(
        self,
        mock_transcribe: AsyncMock,
        mock_moderate: AsyncMock,
        client: AsyncClient,
        auth_headers: dict[str, str],
        test_meeting: models.Meeting,
        db_session: Session,
    ) -> None:
        """POST /transcribe persiste le transcript et retourne les segments."""
        mock_transcribe.return_value = (_FAKE_SEGMENTS, "mock")
        mock_moderate.return_value = _FAKE_MODERATION

        resp = await client.post(
            "/api/transcribe",
            data={"meetingId": test_meeting.id, "durationSec": "120"},
            files={"audio": ("test.webm", io.BytesIO(_DUMMY_AUDIO), "audio/webm")},
            headers=auth_headers,
        )

        assert resp.status_code == 200
        data = resp.json()
        assert "segments" in data
        assert len(data["segments"]) == 2
        assert data["segments"][0]["speaker"] == "Intervenant 1"
        assert data["source"] == "mock"
        assert data["moderation"]["flagged"] is False

        # Vérifie la persistance en DB
        db_session.refresh(test_meeting)
        assert test_meeting.transcript is not None
        assert len(test_meeting.transcript) == 2
        assert test_meeting.duration_min == 2  # ceil(120/60)

    @patch("routers.transcribe.run_moderation", new_callable=AsyncMock)
    @patch("routers.transcribe.transcribe_audio", new_callable=AsyncMock)
    async def test_transcribe_invalid_meeting_id_returns_404(
        self,
        mock_transcribe: AsyncMock,
        mock_moderate: AsyncMock,
        client: AsyncClient,
        auth_headers: dict[str, str],
    ) -> None:
        """Un meetingId inconnu ou appartenant à un autre utilisateur lève 404."""
        mock_transcribe.return_value = (_FAKE_SEGMENTS, "mock")
        mock_moderate.return_value = _FAKE_MODERATION

        resp = await client.post(
            "/api/transcribe",
            data={"meetingId": "nonexistent-meeting-id", "durationSec": "60"},
            files={"audio": ("test.webm", io.BytesIO(_DUMMY_AUDIO), "audio/webm")},
            headers=auth_headers,
        )

        assert resp.status_code == 404

    @patch("routers.transcribe.run_moderation", new_callable=AsyncMock)
    @patch("routers.transcribe.transcribe_audio", new_callable=AsyncMock)
    async def test_transcribe_without_auth_returns_401(
        self,
        mock_transcribe: AsyncMock,
        mock_moderate: AsyncMock,
        client: AsyncClient,
        test_meeting: models.Meeting,
    ) -> None:
        """POST /transcribe sans cookie lève 401."""
        mock_transcribe.return_value = (_FAKE_SEGMENTS, "mock")
        mock_moderate.return_value = _FAKE_MODERATION

        # Réinitialise les cookies du client pour simuler une session non authentifiée.
        saved_cookies = dict(client.cookies)
        client.cookies.clear()
        try:
            resp = await client.post(
                "/api/transcribe",
                data={"meetingId": test_meeting.id, "durationSec": "60"},
                files={"audio": ("test.webm", io.BytesIO(_DUMMY_AUDIO), "audio/webm")},
            )
            assert resp.status_code == 401
        finally:
            client.cookies.update(saved_cookies)

    @patch("routers.transcribe.run_moderation", new_callable=AsyncMock)
    @patch("routers.transcribe.transcribe_audio", new_callable=AsyncMock)
    async def test_transcribe_persists_moderation(
        self,
        mock_transcribe: AsyncMock,
        mock_moderate: AsyncMock,
        client: AsyncClient,
        auth_headers: dict[str, str],
        test_meeting: models.Meeting,
        db_session: Session,
    ) -> None:
        """La modération est stockée dans meeting.moderation après la transcription."""
        mock_transcribe.return_value = (_FAKE_SEGMENTS, "mock")
        flagged_mod = ModerateResponse(
            flagged=True, category="Injection de prompt", rationale="test", source="mock"
        )
        mock_moderate.return_value = flagged_mod

        resp = await client.post(
            "/api/transcribe",
            data={"meetingId": test_meeting.id, "durationSec": "30"},
            files={"audio": ("test.webm", io.BytesIO(_DUMMY_AUDIO), "audio/webm")},
            headers=auth_headers,
        )

        assert resp.status_code == 200
        db_session.refresh(test_meeting)
        assert test_meeting.moderation is not None
        assert test_meeting.moderation["flagged"] is True

    @patch("routers.transcribe.run_moderation", new_callable=AsyncMock)
    @patch("routers.transcribe.transcribe_audio", new_callable=AsyncMock)
    async def test_transcribe_short_duration_rounded_to_one_minute(
        self,
        mock_transcribe: AsyncMock,
        mock_moderate: AsyncMock,
        client: AsyncClient,
        auth_headers: dict[str, str],
        test_meeting: models.Meeting,
        db_session: Session,
    ) -> None:
        """Une durée de 0 secondes est arrondie à 1 minute minimum."""
        mock_transcribe.return_value = (_FAKE_SEGMENTS, "mock")
        mock_moderate.return_value = _FAKE_MODERATION

        await client.post(
            "/api/transcribe",
            data={"meetingId": test_meeting.id, "durationSec": "0"},
            files={"audio": ("test.webm", io.BytesIO(_DUMMY_AUDIO), "audio/webm")},
            headers=auth_headers,
        )

        db_session.refresh(test_meeting)
        assert test_meeting.duration_min == 1
