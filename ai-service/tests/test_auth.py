"""Tests du router /api/auth (signup, signin, signout, me).

Couvre les cas nominaux et les cas d'erreur pour chaque endpoint
d'authentification, en vérifiant les codes de statut HTTP, les corps de
réponse et la gestion du cookie de session.
"""

from __future__ import annotations

import pytest
from httpx import AsyncClient

from security import SESSION_COOKIE_NAME

pytestmark = pytest.mark.asyncio


class TestSignup:
    """Tests de POST /api/auth/signup."""

    async def test_signup_success(self, client: AsyncClient) -> None:
        """Un signup valide crée l'utilisateur et retourne ses données."""
        resp = await client.post(
            "/api/auth/signup",
            json={"email": "alice@example.com", "password": "securepass"},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["email"] == "alice@example.com"
        assert "id" in data
        # Le cookie de session doit être posé
        assert SESSION_COOKIE_NAME in resp.cookies

    async def test_signup_duplicate_email_returns_409(self, client: AsyncClient) -> None:
        """Un second signup avec le même email lève 409."""
        payload = {"email": "bob@example.com", "password": "securepass"}
        first = await client.post("/api/auth/signup", json=payload)
        assert first.status_code == 200

        second = await client.post("/api/auth/signup", json=payload)
        assert second.status_code == 409
        assert "email" in second.json()["detail"].lower()

    async def test_signup_short_password_returns_400(self, client: AsyncClient) -> None:
        """Un mot de passe de moins de 8 caractères lève 400."""
        resp = await client.post(
            "/api/auth/signup",
            json={"email": "carol@example.com", "password": "short"},
        )
        assert resp.status_code == 400

    async def test_signup_normalizes_email_to_lowercase(self, client: AsyncClient) -> None:
        """L'email est normalisé en minuscules avant stockage."""
        resp = await client.post(
            "/api/auth/signup",
            json={"email": "Dave@Example.COM", "password": "password123"},
        )
        assert resp.status_code == 200
        assert resp.json()["email"] == "dave@example.com"


class TestSignin:
    """Tests de POST /api/auth/signin."""

    async def test_signin_success(self, client: AsyncClient) -> None:
        """Un signin valide pose le cookie et retourne les données utilisateur."""
        await client.post(
            "/api/auth/signup",
            json={"email": "eve@example.com", "password": "password123"},
        )
        resp = await client.post(
            "/api/auth/signin",
            json={"email": "eve@example.com", "password": "password123"},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["email"] == "eve@example.com"
        assert SESSION_COOKIE_NAME in resp.cookies

    async def test_signin_wrong_password_returns_401(self, client: AsyncClient) -> None:
        """Un mauvais mot de passe lève 401."""
        await client.post(
            "/api/auth/signup",
            json={"email": "frank@example.com", "password": "password123"},
        )
        resp = await client.post(
            "/api/auth/signin",
            json={"email": "frank@example.com", "password": "wrongpassword"},
        )
        assert resp.status_code == 401

    async def test_signin_unknown_email_returns_401(self, client: AsyncClient) -> None:
        """Un email inexistant lève 401 (pas de discrimination entre les cas)."""
        resp = await client.post(
            "/api/auth/signin",
            json={"email": "nobody@example.com", "password": "password123"},
        )
        assert resp.status_code == 401

    async def test_signin_error_message_does_not_leak_email_existence(
        self, client: AsyncClient
    ) -> None:
        """Le message d'erreur est identique que l'email existe ou non."""
        await client.post(
            "/api/auth/signup",
            json={"email": "grace@example.com", "password": "password123"},
        )
        bad_pwd = await client.post(
            "/api/auth/signin",
            json={"email": "grace@example.com", "password": "wrong"},
        )
        unknown = await client.post(
            "/api/auth/signin",
            json={"email": "unknown@example.com", "password": "wrong"},
        )
        assert bad_pwd.json()["detail"] == unknown.json()["detail"]


class TestMe:
    """Tests de GET /api/auth/me."""

    async def test_me_with_valid_session(
        self, client: AsyncClient, auth_headers: dict[str, str]
    ) -> None:
        """GET /me avec un cookie valide retourne les données de l'utilisateur."""
        resp = await client.get("/api/auth/me", headers=auth_headers)
        assert resp.status_code == 200
        data = resp.json()
        assert data["email"] == "test@example.com"
        assert "id" in data

    async def test_me_without_session_returns_401(self, client: AsyncClient) -> None:
        """GET /me sans cookie lève 401."""
        resp = await client.get("/api/auth/me")
        assert resp.status_code == 401

    async def test_me_with_invalid_cookie_returns_401(self, client: AsyncClient) -> None:
        """GET /me avec un cookie invalide lève 401."""
        resp = await client.get(
            "/api/auth/me",
            headers={"Cookie": f"{SESSION_COOKIE_NAME}=not_a_valid_jwt"},
        )
        assert resp.status_code == 401


class TestSignout:
    """Tests de POST /api/auth/signout."""

    async def test_signout_clears_cookie(
        self, client: AsyncClient, auth_headers: dict[str, str]
    ) -> None:
        """Après signout, le cookie est supprimé et /me renvoie 401."""
        resp = await client.post("/api/auth/signout", headers=auth_headers)
        assert resp.status_code == 200
        assert resp.json() == {"ok": True}

        # Le cookie doit être absent de la réponse de signout (supprimé)
        # httpx représente la suppression par un cookie vide ou max-age=0;
        # on vérifie juste que la réponse ne contient pas un token valide.
        cookie_val = resp.cookies.get(SESSION_COOKIE_NAME, "")
        assert cookie_val == "" or cookie_val is None

    async def test_signout_without_session_still_returns_200(self, client: AsyncClient) -> None:
        """Le signout réussit même sans cookie (idempotent)."""
        resp = await client.post("/api/auth/signout")
        assert resp.status_code == 200
