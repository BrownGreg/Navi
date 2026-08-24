"""Tests du router /api/meetings (CRUD des réunions).

Couvre la liste, la création, la récupération par id et par share_id,
ainsi que les contrôles d'accès et les 404 attendus.
"""
from __future__ import annotations

import pytest
from httpx import AsyncClient
from sqlalchemy.orm import Session

import models
from security import SESSION_COOKIE_NAME


pytestmark = pytest.mark.asyncio


class TestListMeetings:
    """Tests de GET /api/meetings."""

    async def test_list_meetings_empty(
        self, client: AsyncClient, auth_headers: dict[str, str]
    ) -> None:
        """Un utilisateur sans réunion obtient une liste vide."""
        resp = await client.get("/api/meetings", headers=auth_headers)
        assert resp.status_code == 200
        assert resp.json() == []

    async def test_list_meetings_with_data(
        self,
        client: AsyncClient,
        auth_headers: dict[str, str],
        test_meeting: models.Meeting,
    ) -> None:
        """La liste contient les réunions appartenant à l'utilisateur courant."""
        resp = await client.get("/api/meetings", headers=auth_headers)
        assert resp.status_code == 200
        data = resp.json()
        assert len(data) == 1
        assert data[0]["id"] == test_meeting.id
        assert data[0]["title"] == test_meeting.title

    async def test_list_meetings_without_auth_returns_401(
        self, client: AsyncClient
    ) -> None:
        """GET /meetings sans cookie lève 401."""
        resp = await client.get("/api/meetings")
        assert resp.status_code == 401

    async def test_list_meetings_does_not_return_other_users_meetings(
        self,
        client: AsyncClient,
        auth_headers: dict[str, str],
        test_meeting: models.Meeting,
        db_session: Session,
    ) -> None:
        """Les réunions d'un autre utilisateur ne sont pas visibles."""
        # Crée un second utilisateur avec sa propre réunion
        second_user = models.User(
            email="other@example.com",
            password_hash="fakehash",
        )
        db_session.add(second_user)
        db_session.commit()
        db_session.refresh(second_user)
        other_meeting = models.Meeting(
            owner_id=second_user.id,
            title="Réunion secrète",
            mode="dictaphone",
        )
        db_session.add(other_meeting)
        db_session.commit()

        resp = await client.get("/api/meetings", headers=auth_headers)
        assert resp.status_code == 200
        ids = [m["id"] for m in resp.json()]
        assert other_meeting.id not in ids


class TestCreateMeeting:
    """Tests de POST /api/meetings."""

    async def test_create_meeting_success(
        self, client: AsyncClient, auth_headers: dict[str, str]
    ) -> None:
        """La création d'une réunion retourne les données persistées."""
        resp = await client.post(
            "/api/meetings",
            json={"title": "Stand-up du matin", "mode": "dictaphone", "retentionDays": 14},
            headers=auth_headers,
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["title"] == "Stand-up du matin"
        assert data["mode"] == "dictaphone"
        assert data["retentionDays"] == 14
        assert "id" in data
        assert "shareId" in data

    async def test_create_meeting_visio_mode(
        self, client: AsyncClient, auth_headers: dict[str, str]
    ) -> None:
        """Une réunion peut être créée en mode visio."""
        resp = await client.post(
            "/api/meetings",
            json={"title": "Appel client", "mode": "visio"},
            headers=auth_headers,
        )
        assert resp.status_code == 200
        assert resp.json()["mode"] == "visio"

    async def test_create_meeting_without_auth_returns_401(
        self, client: AsyncClient
    ) -> None:
        """POST /meetings sans cookie lève 401."""
        resp = await client.post(
            "/api/meetings",
            json={"title": "Sans auth"},
        )
        assert resp.status_code == 401

    async def test_create_meeting_empty_title_uses_default(
        self, client: AsyncClient, auth_headers: dict[str, str]
    ) -> None:
        """Un titre vide est remplacé par le titre par défaut."""
        resp = await client.post(
            "/api/meetings",
            json={"title": "   "},
            headers=auth_headers,
        )
        assert resp.status_code == 200
        assert resp.json()["title"] == "Reunion sans titre"

    async def test_create_meeting_default_status_is_processing(
        self, client: AsyncClient, auth_headers: dict[str, str]
    ) -> None:
        """Une réunion créée a le statut 'processing' par défaut."""
        resp = await client.post(
            "/api/meetings",
            json={"title": "Nouvelle réunion"},
            headers=auth_headers,
        )
        assert resp.status_code == 200
        assert resp.json()["status"] == "processing"


class TestGetMeetingById:
    """Tests de GET /api/meetings/{meeting_id}."""

    async def test_get_meeting_found(
        self,
        client: AsyncClient,
        auth_headers: dict[str, str],
        test_meeting: models.Meeting,
    ) -> None:
        """Un meeting appartenant à l'utilisateur est retourné."""
        resp = await client.get(
            f"/api/meetings/{test_meeting.id}", headers=auth_headers
        )
        assert resp.status_code == 200
        assert resp.json()["id"] == test_meeting.id

    async def test_get_meeting_nonexistent_returns_404(
        self, client: AsyncClient, auth_headers: dict[str, str]
    ) -> None:
        """Un id inexistant lève 404."""
        resp = await client.get(
            "/api/meetings/nonexistent-id-000", headers=auth_headers
        )
        assert resp.status_code == 404

    async def test_get_meeting_of_other_user_returns_404(
        self,
        client: AsyncClient,
        auth_headers: dict[str, str],
        db_session: Session,
    ) -> None:
        """La réunion d'un autre utilisateur est introuvable (404, pas 403)."""
        other_user = models.User(email="other2@example.com", password_hash="fakehash")
        db_session.add(other_user)
        db_session.commit()
        db_session.refresh(other_user)
        other_meeting = models.Meeting(
            owner_id=other_user.id,
            title="Privée",
            mode="dictaphone",
        )
        db_session.add(other_meeting)
        db_session.commit()

        resp = await client.get(
            f"/api/meetings/{other_meeting.id}", headers=auth_headers
        )
        assert resp.status_code == 404

    async def test_get_meeting_without_auth_returns_401(
        self, client: AsyncClient, test_meeting: models.Meeting
    ) -> None:
        """Accès sans cookie lève 401."""
        # Réinitialise les cookies du client pour simuler une session non authentifiée.
        saved_cookies = dict(client.cookies)
        client.cookies.clear()
        try:
            resp = await client.get(f"/api/meetings/{test_meeting.id}")
            assert resp.status_code == 401
        finally:
            client.cookies.update(saved_cookies)


class TestGetMeetingByShare:
    """Tests de GET /api/meetings/by-share/{share_id}."""

    async def test_get_by_share_found(
        self,
        client: AsyncClient,
        test_meeting: models.Meeting,
    ) -> None:
        """Un meeting est accessible via son share_id (endpoint public)."""
        resp = await client.get(f"/api/meetings/by-share/{test_meeting.share_id}")
        assert resp.status_code == 200
        assert resp.json()["id"] == test_meeting.id

    async def test_get_by_share_nonexistent_returns_404(
        self, client: AsyncClient
    ) -> None:
        """Un share_id inexistant lève 404."""
        resp = await client.get("/api/meetings/by-share/shr-doesnotexist")
        assert resp.status_code == 404
