"""Tests du router /api/generate-cr (génération du compte-rendu IA).

Le client kimi est mocké. Les tests vérifient la structure de la réponse,
la persistance du CR en base et le passage du statut à 'ready'.
"""
from __future__ import annotations

from unittest.mock import AsyncMock, patch

import pytest
from httpx import AsyncClient
from sqlalchemy.orm import Session

import models
from schemas import CRAction, MeetingCR, TranscriptSegment


pytestmark = pytest.mark.asyncio

# ---------------------------------------------------------------------------
# Fixtures locales
# ---------------------------------------------------------------------------

_FAKE_TRANSCRIPT = [
    TranscriptSegment(speaker="Alice", text="On valide le budget.", start=0.0),
    TranscriptSegment(speaker="Bob", text="D'accord, je m'en occupe.", start=5.0),
]

_FAKE_CR = MeetingCR(
    resume="Validation du budget pour Q3.",
    decisions=["Budget Q3 validé"],
    actions=[CRAction(text="Préparer le bon de commande", owner="Bob")],
    themes=["Budget", "Décision"],
)


def _inject_transcript(meeting: models.Meeting, db: Session) -> None:
    """Injecte un transcript dans la réunion pour activer la génération du CR."""
    meeting.transcript = [s.model_dump() for s in _FAKE_TRANSCRIPT]
    db.commit()


class TestGenerateCR:
    """Tests de POST /api/generate-cr."""

    @patch("routers.generate_cr.run_generate_cr", new_callable=AsyncMock)
    async def test_generate_cr_success(
        self,
        mock_kimi: AsyncMock,
        client: AsyncClient,
        auth_headers: dict[str, str],
        test_meeting: models.Meeting,
        db_session: Session,
    ) -> None:
        """POST /generate-cr retourne le CR et le persiste en base."""
        _inject_transcript(test_meeting, db_session)
        mock_kimi.return_value = (_FAKE_CR, "mock")

        resp = await client.post(
            "/api/generate-cr",
            json={"meetingId": test_meeting.id},
            headers=auth_headers,
        )

        assert resp.status_code == 200
        data = resp.json()
        assert "cr" in data
        assert data["cr"]["resume"] == "Validation du budget pour Q3."
        assert data["source"] == "mock"
        assert len(data["cr"]["decisions"]) == 1
        assert len(data["cr"]["actions"]) == 1

    @patch("routers.generate_cr.run_generate_cr", new_callable=AsyncMock)
    async def test_generate_cr_persists_in_db(
        self,
        mock_kimi: AsyncMock,
        client: AsyncClient,
        auth_headers: dict[str, str],
        test_meeting: models.Meeting,
        db_session: Session,
    ) -> None:
        """Le CR et le statut 'ready' sont persistés après l'appel."""
        _inject_transcript(test_meeting, db_session)
        mock_kimi.return_value = (_FAKE_CR, "mock")

        await client.post(
            "/api/generate-cr",
            json={"meetingId": test_meeting.id},
            headers=auth_headers,
        )

        db_session.refresh(test_meeting)
        assert test_meeting.cr is not None
        assert test_meeting.cr["resume"] == "Validation du budget pour Q3."
        assert test_meeting.status == "ready"

    @patch("routers.generate_cr.run_generate_cr", new_callable=AsyncMock)
    async def test_generate_cr_without_transcript_returns_404(
        self,
        mock_kimi: AsyncMock,
        client: AsyncClient,
        auth_headers: dict[str, str],
        test_meeting: models.Meeting,
    ) -> None:
        """Sans transcript existant, /generate-cr lève 404."""
        # test_meeting n'a pas de transcript
        resp = await client.post(
            "/api/generate-cr",
            json={"meetingId": test_meeting.id},
            headers=auth_headers,
        )

        assert resp.status_code == 404
        mock_kimi.assert_not_called()

    @patch("routers.generate_cr.run_generate_cr", new_callable=AsyncMock)
    async def test_generate_cr_nonexistent_meeting_returns_404(
        self,
        mock_kimi: AsyncMock,
        client: AsyncClient,
        auth_headers: dict[str, str],
    ) -> None:
        """Un meetingId inconnu lève 404."""
        resp = await client.post(
            "/api/generate-cr",
            json={"meetingId": "nonexistent-meeting-id"},
            headers=auth_headers,
        )

        assert resp.status_code == 404
        mock_kimi.assert_not_called()

    @patch("routers.generate_cr.run_generate_cr", new_callable=AsyncMock)
    async def test_generate_cr_without_auth_returns_401(
        self,
        mock_kimi: AsyncMock,
        client: AsyncClient,
        test_meeting: models.Meeting,
        db_session: Session,
    ) -> None:
        """POST /generate-cr sans cookie lève 401."""
        _inject_transcript(test_meeting, db_session)

        # Réinitialise les cookies du client pour simuler une session non authentifiée.
        saved_cookies = dict(client.cookies)
        client.cookies.clear()
        try:
            resp = await client.post(
                "/api/generate-cr",
                json={"meetingId": test_meeting.id},
            )
            assert resp.status_code == 401
            mock_kimi.assert_not_called()
        finally:
            client.cookies.update(saved_cookies)

    @patch("routers.generate_cr.run_generate_cr", new_callable=AsyncMock)
    async def test_generate_cr_real_source_propagated(
        self,
        mock_kimi: AsyncMock,
        client: AsyncClient,
        auth_headers: dict[str, str],
        test_meeting: models.Meeting,
        db_session: Session,
    ) -> None:
        """La source 'real' est propagée correctement au meeting."""
        _inject_transcript(test_meeting, db_session)
        mock_kimi.return_value = (_FAKE_CR, "real")

        await client.post(
            "/api/generate-cr",
            json={"meetingId": test_meeting.id},
            headers=auth_headers,
        )

        db_session.refresh(test_meeting)
        assert test_meeting.source == "real"
