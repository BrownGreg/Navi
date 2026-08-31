"""Tests du router /api/rgpd-request (exercice des droits RGPD).

L'endpoint est public (sans authentification) par choix délibéré :
les participants à une réunion sans compte doivent pouvoir exercer leurs droits.
"""

from __future__ import annotations

import pytest
from httpx import AsyncClient
from sqlalchemy.orm import Session

import models

pytestmark = pytest.mark.asyncio


class TestRgpdRequest:
    """Tests de POST /api/rgpd-request."""

    async def test_rgpd_access_request(self, client: AsyncClient) -> None:
        """Une demande de type 'access' est créée et retournée."""
        resp = await client.post(
            "/api/rgpd-request",
            json={
                "email": "participant@example.com",
                "meetingId": "meeting-abc-123",
                "type": "access",
            },
        )

        assert resp.status_code == 200
        data = resp.json()
        assert data["email"] == "participant@example.com"
        assert data["meetingId"] == "meeting-abc-123"
        assert data["type"] == "access"
        assert "id" in data
        assert "createdAt" in data

    async def test_rgpd_erasure_request(self, client: AsyncClient) -> None:
        """Une demande de type 'erasure' (effacement) est persistée."""
        resp = await client.post(
            "/api/rgpd-request",
            json={
                "email": "todelete@example.com",
                "meetingId": "meeting-xyz-789",
                "type": "erasure",
            },
        )

        assert resp.status_code == 200
        assert resp.json()["type"] == "erasure"

    async def test_rgpd_rectification_request(self, client: AsyncClient) -> None:
        """Une demande de type 'rectification' est persistée."""
        resp = await client.post(
            "/api/rgpd-request",
            json={
                "email": "fix@example.com",
                "meetingId": "meeting-rec-456",
                "type": "rectification",
            },
        )

        assert resp.status_code == 200
        assert resp.json()["type"] == "rectification"

    async def test_rgpd_request_is_public_no_auth_needed(self, client: AsyncClient) -> None:
        """L'endpoint est accessible sans cookie de session (public par design)."""
        resp = await client.post(
            "/api/rgpd-request",
            json={
                "email": "anon@example.com",
                "meetingId": "some-meeting-id",
                "type": "access",
            },
            # Aucun header d'authentification
        )

        assert resp.status_code == 200

    async def test_rgpd_request_persisted_in_db(
        self, client: AsyncClient, db_session: Session
    ) -> None:
        """La demande RGPD est effectivement stockée en base de données."""
        resp = await client.post(
            "/api/rgpd-request",
            json={
                "email": "check@example.com",
                "meetingId": "m-persist-test",
                "type": "erasure",
            },
        )
        assert resp.status_code == 200
        request_id = resp.json()["id"]

        entry = db_session.get(models.RgpdRequest, request_id)
        assert entry is not None
        assert entry.email == "check@example.com"
        assert entry.meeting_id == "m-persist-test"
        assert entry.type == "erasure"

    async def test_rgpd_request_invalid_type_returns_422(self, client: AsyncClient) -> None:
        """Un type non reconnu (pas dans l'enum) lève 422."""
        resp = await client.post(
            "/api/rgpd-request",
            json={
                "email": "bad@example.com",
                "meetingId": "m-bad-type",
                "type": "invalid_type",
            },
        )

        assert resp.status_code == 422

    async def test_rgpd_multiple_requests_allowed_for_same_meeting(
        self, client: AsyncClient
    ) -> None:
        """Plusieurs demandes sur le même meeting_id sont autorisées (pas de contrainte d'unicité)."""
        payload = {
            "email": "multi@example.com",
            "meetingId": "m-multi",
            "type": "access",
        }
        resp1 = await client.post("/api/rgpd-request", json=payload)
        resp2 = await client.post("/api/rgpd-request", json=payload)

        assert resp1.status_code == 200
        assert resp2.status_code == 200
        assert resp1.json()["id"] != resp2.json()["id"]


class TestListRgpdRequests:
    """Tests de GET /api/rgpd-requests (vue organisateur)."""

    async def test_requires_auth(self, client: AsyncClient) -> None:
        resp = await client.get("/api/rgpd-requests")
        assert resp.status_code == 401

    async def test_organizer_sees_requests_for_own_meeting(
        self,
        client: AsyncClient,
        auth_headers: dict[str, str],
        test_meeting: models.Meeting,
    ) -> None:
        await client.post(
            "/api/rgpd-request",
            json={
                "email": "participant@example.com",
                "meetingId": test_meeting.id,
                "type": "access",
            },
        )

        resp = await client.get("/api/rgpd-requests", headers=auth_headers)

        assert resp.status_code == 200
        data = resp.json()
        assert len(data) == 1
        assert data[0]["meetingId"] == test_meeting.id
        assert data[0]["email"] == "participant@example.com"

    async def test_organizer_does_not_see_other_organizer_requests(
        self,
        client: AsyncClient,
        auth_headers: dict[str, str],
        test_meeting: models.Meeting,
    ) -> None:
        """Critere de securite cle : pas de fuite entre organisateurs (regression
        sur l'ancien comportement qui listait toutes les demandes sans filtre)."""
        await client.post(
            "/api/rgpd-request",
            json={
                "email": "participant@example.com",
                "meetingId": test_meeting.id,
                "type": "access",
            },
        )

        signup2 = await client.post(
            "/api/auth/signup",
            json={"email": "autre-organisateur@example.com", "password": "password123"},
        )
        assert signup2.status_code == 200
        other_cookie = signup2.cookies.get("navi_session")
        other_headers = {"Cookie": f"navi_session={other_cookie}"}

        resp = await client.get("/api/rgpd-requests", headers=other_headers)

        assert resp.status_code == 200
        assert resp.json() == []

    async def test_request_with_unmatched_meeting_id_is_invisible(
        self,
        client: AsyncClient,
        auth_headers: dict[str, str],
    ) -> None:
        """Un meeting_id qui ne correspond a aucune reunion existante (faute
        de frappe participant, etc.) n'apparait pour personne - toujours
        stocke en base (verifie dans TestRgpdRequest), juste pas rattachable."""
        await client.post(
            "/api/rgpd-request",
            json={"email": "x@example.com", "meetingId": "meeting-inexistant", "type": "access"},
        )

        resp = await client.get("/api/rgpd-requests", headers=auth_headers)

        assert resp.status_code == 200
        assert resp.json() == []
