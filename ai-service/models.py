import uuid
from datetime import datetime, timezone

from sqlalchemy import DateTime, ForeignKey, Integer, JSON, String
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
