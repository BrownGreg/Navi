"""Fixtures partagées pour la suite de tests du service FastAPI Navi.

Chaque test obtient une DB SQLite en mémoire isolée grâce à ``StaticPool``
(toutes les connexions de la session de test partagent la même DB en mémoire),
un AsyncClient httpx monté en mode ASGI, et des helpers pour l'authentification
et la création de données de test.

Architecture d'isolation :
- ``StaticPool`` garantit qu'une DB in-memory n'est pas ré-initialisée à
  chaque ``connect()``, ce qui est le piège classique avec SQLite + SQLAlchemy.
- ``get_db`` est remplacée par une factory qui yield la session de test.
- L'engine est disposé après chaque test pour libérer la mémoire.
"""

from __future__ import annotations

import os

# JWT_SECRET doit être défini AVANT tout import de security.py (qui lève
# RuntimeError si la variable est absente au moment du chargement du module).
os.environ.setdefault("JWT_SECRET", "test-secret-for-pytest-only")
os.environ.setdefault("AI_SERVICE_DATABASE_URL", "sqlite:///:memory:")

from typing import AsyncGenerator, Generator

import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

import models  # noqa: F401 – enregistre les modèles sur Base.metadata
from db import Base, get_db
from main import app as _app
from security import SESSION_COOKIE_NAME

# ---------------------------------------------------------------------------
# Fixtures d'infrastructure (engine + session + client HTTP)
# ---------------------------------------------------------------------------


@pytest.fixture()
def db_engine():
    """Engine SQLite in-memory isolé par test (via StaticPool).

    ``StaticPool`` force SQLAlchemy à réutiliser la même connexion sous-jacente,
    ce qui est indispensable pour SQLite in-memory : sans ça, chaque nouvelle
    connexion obtiendrait une DB vide distincte.

    Yields:
        Engine SQLAlchemy avec les tables créées et prêtes à l'emploi.
    """
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=engine)
    yield engine
    Base.metadata.drop_all(bind=engine)
    engine.dispose()


@pytest.fixture()
def db_session(db_engine) -> Generator[Session, None, None]:
    """Session SQLAlchemy liée à l'engine de test.

    Args:
        db_engine: Engine SQLite in-memory de la fixture ``db_engine``.

    Yields:
        Session SQLAlchemy prête à l'emploi.
    """
    TestingSessionLocal = sessionmaker(bind=db_engine, autoflush=False, autocommit=False)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


@pytest.fixture()
async def client(db_session: Session) -> AsyncGenerator[AsyncClient, None]:
    """AsyncClient httpx monté en mode ASGI avec override de la dépendance DB.

    Remplace ``get_db`` par une factory qui cède la session de test, de sorte
    que chaque handler FastAPI travaille sur la même base SQLite in-memory que
    les assertions des tests.

    Args:
        db_session: Session de test fournie par la fixture ``db_session``.

    Yields:
        AsyncClient httpx branché sur l'application FastAPI.
    """

    def _override_get_db() -> Generator[Session, None, None]:
        """Override de get_db : yield la session de test sans la fermer."""
        yield db_session

    _app.dependency_overrides[get_db] = _override_get_db
    transport = ASGITransport(app=_app)  # type: ignore[arg-type]
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac
    _app.dependency_overrides.pop(get_db, None)


@pytest.fixture()
async def auth_headers(client: AsyncClient) -> dict[str, str]:
    """Crée un utilisateur de test via l'API signup et retourne le cookie de session.

    Args:
        client: AsyncClient de test.

    Returns:
        Dictionnaire ``{"Cookie": "navi_session=<jwt>"}`` prêt à être passé
        en en-tête des requêtes protégées.
    """
    resp = await client.post(
        "/api/auth/signup",
        json={"email": "test@example.com", "password": "password123"},
    )
    assert resp.status_code == 200, f"signup a échoué : {resp.text}"

    cookie_value = resp.cookies.get(SESSION_COOKIE_NAME)
    assert cookie_value, "Aucun cookie de session retourné par /api/auth/signup"
    return {"Cookie": f"{SESSION_COOKIE_NAME}={cookie_value}"}


@pytest.fixture()
async def test_meeting(
    client: AsyncClient,
    auth_headers: dict[str, str],
    db_session: Session,
) -> models.Meeting:
    """Crée une réunion de test appartenant à l'utilisateur authentifié.

    Args:
        client: AsyncClient de test.
        auth_headers: Cookie de session de l'utilisateur test.
        db_session: Session DB de test pour relire l'objet créé.

    Returns:
        Instance ``models.Meeting`` fraîchement créée en base.
    """
    resp = await client.post(
        "/api/meetings",
        json={"title": "Réunion de test", "mode": "dictaphone", "retentionDays": 30},
        headers=auth_headers,
    )
    assert resp.status_code == 200, f"Création de réunion échouée : {resp.text}"
    meeting_id = resp.json()["id"]

    db_session.expire_all()
    meeting = db_session.get(models.Meeting, meeting_id)
    assert meeting is not None, f"Meeting {meeting_id} introuvable en DB"
    return meeting


@pytest.fixture()
async def consented_meeting(
    client: AsyncClient,
    auth_headers: dict[str, str],
    test_meeting: models.Meeting,
    db_session: Session,
) -> models.Meeting:
    """Comme ``test_meeting``, avec le consentement organisateur deja accorde.

    A utiliser par les tests qui verifient le comportement APRES consentement
    (ex: /transcribe, /visio/join reussissent). Les tests qui verifient le
    rejet SANS consentement doivent utiliser ``test_meeting`` directement.

    Accorde les 4 types (superset des 2 requis par le dictaphone et des 4
    requis par le visio - cf. schemas.DICTAPHONE_REQUIRED_CONSENT/
    VISIO_REQUIRED_CONSENT), pour rester utilisable par les deux flux.

    Returns:
        Instance ``models.Meeting`` avec ses ConsentRecord deja persistes en base.
    """
    resp = await client.post(
        f"/api/meetings/{test_meeting.id}/consent",
        json={
            "consentTypes": [
                "oral_recording",
                "transcript",
                "ai_processing",
                "participant_sharing",
            ]
        },
        headers=auth_headers,
    )
    assert resp.status_code == 200, f"Octroi du consentement echoue : {resp.text}"

    db_session.expire_all()
    meeting = db_session.get(models.Meeting, test_meeting.id)
    assert meeting is not None
    return meeting
