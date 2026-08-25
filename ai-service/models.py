import uuid
from datetime import datetime, timezone

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, JSON, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from db import Base


def _uuid() -> str:
    return uuid.uuid4().hex


def _share_id() -> str:
    return f"shr-{uuid.uuid4().hex[:10]}"


def _now() -> datetime:
    return datetime.now(timezone.utc)


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=_uuid)
    email: Mapped[str] = mapped_column(String, unique=True, index=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=_now)

    meetings: Mapped[list["Meeting"]] = relationship(back_populates="owner")


class Meeting(Base):
    __tablename__ = "meetings"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=_uuid)
    owner_id: Mapped[str] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)
    share_id: Mapped[str] = mapped_column(String, unique=True, index=True, default=_share_id)
    title: Mapped[str] = mapped_column(String, nullable=False)
    mode: Mapped[str] = mapped_column(String, nullable=False)
    date: Mapped[datetime] = mapped_column(DateTime, default=_now)
    duration_min: Mapped[int] = mapped_column(Integer, default=0)
    status: Mapped[str] = mapped_column(String, default="processing")
    source: Mapped[str] = mapped_column(String, default="mock")
    retention_days: Mapped[int] = mapped_column(Integer, default=30)
    transcript: Mapped[list | None] = mapped_column(JSON, nullable=True)
    cr: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    platform: Mapped[str | None] = mapped_column(String, nullable=True)
    native_meeting_id: Mapped[str | None] = mapped_column(String, nullable=True)
    moderation: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    classification: Mapped[dict | None] = mapped_column(JSON, nullable=True)

    owner: Mapped["User"] = relationship(back_populates="meetings")


class CalendarConnection(Base):
    __tablename__ = "calendar_connections"
    __table_args__ = (UniqueConstraint("owner_id", "provider", name="uq_calendar_owner_provider"),)

    # access_token/refresh_token stockes en clair : coherent avec la posture
    # de securite actuelle du projet (JWT_SECRET en simple variable d'env,
    # SQLite non chiffre - cf. security.py). Voie d'amelioration a bas cout
    # si besoin : chiffrement Fernet (paquet `cryptography`, deja dependance
    # transitive de python-jose[cryptography]) keye par un futur
    # TOKEN_ENCRYPTION_KEY - non implemente ici pour ne pas ajouter un
    # probleme de gestion de cle disproportionne par rapport au reste de l'app.
    id: Mapped[str] = mapped_column(String, primary_key=True, default=_uuid)
    owner_id: Mapped[str] = mapped_column(ForeignKey("users.id"), index=True, nullable=False)
    provider: Mapped[str] = mapped_column(String, nullable=False)  # "google" | "microsoft"
    access_token: Mapped[str] = mapped_column(String, nullable=False)
    refresh_token: Mapped[str] = mapped_column(String, nullable=False)
    token_expires_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    account_email: Mapped[str | None] = mapped_column(String, nullable=True)
    needs_reauth: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=_now, onupdate=_now)


class CalendarSyncedEvent(Base):
    __tablename__ = "calendar_synced_events"
    __table_args__ = (UniqueConstraint("connection_id", "external_event_id", name="uq_calendar_event"),)

    id: Mapped[str] = mapped_column(String, primary_key=True, default=_uuid)
    connection_id: Mapped[str] = mapped_column(ForeignKey("calendar_connections.id"), index=True, nullable=False)
    external_event_id: Mapped[str] = mapped_column(String, nullable=False)
    title: Mapped[str] = mapped_column(String, nullable=False)
    start_time: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    platform: Mapped[str | None] = mapped_column(String, nullable=True)
    native_meeting_id: Mapped[str | None] = mapped_column(String, nullable=True)
    status: Mapped[str] = mapped_column(String, default="pending")  # pending|joined|skipped|failed
    meeting_id: Mapped[str | None] = mapped_column(ForeignKey("meetings.id"), nullable=True)
    joined_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=_now)


class RgpdRequest(Base):
    __tablename__ = "rgpd_requests"

    # Pas de ForeignKey vers Meeting : une demande RGPD d'effacement doit
    # pouvoir survivre a la suppression du meeting qu'elle reference (l'audit
    # de la demande ne doit pas dependre du cycle de vie de la donnee effacee).
    id: Mapped[str] = mapped_column(String, primary_key=True, default=_uuid)
    email: Mapped[str] = mapped_column(String, nullable=False)
    meeting_id: Mapped[str] = mapped_column(String, index=True, nullable=False)
    type: Mapped[str] = mapped_column(String, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=_now)
