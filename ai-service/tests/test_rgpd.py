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
