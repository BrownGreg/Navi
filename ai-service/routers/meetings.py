from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

import models
from crud import get_owned_meeting
from db import get_db
from deps import get_current_user
from schemas import (
    ActionUpdate,
    ConsentGrantRequest,
    ConsentRecordOut,
    MeetingCreate,
    MeetingOut,
    MeetingUpdate,
)

router = APIRouter(prefix="/meetings", tags=["meetings"])


@router.get("", response_model=list[MeetingOut])
def list_meetings(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[models.Meeting]:
    return (
        db.query(models.Meeting)
        .filter(models.Meeting.owner_id == current_user.id, models.Meeting.deleted_at.is_(None))
        .order_by(models.Meeting.date.desc())
        .all()
    )


@router.post("", response_model=MeetingOut)
def create_meeting(
    body: MeetingCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> models.Meeting:
    meeting = models.Meeting(
        owner_id=current_user.id,
        title=body.title.strip() or "Reunion sans titre",
        mode=body.mode if body.mode == "visio" else "dictaphone",
        retention_days=body.retention_days or 30,
    )
    db.add(meeting)
    db.commit()
    db.refresh(meeting)
    return meeting


@router.post("/{meeting_id}/consent", response_model=list[ConsentRecordOut])
def grant_consent(
    meeting_id: str,
    body: ConsentGrantRequest,
    request: Request,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[models.ConsentRecord]:
    """Enregistre le(s) consentement(s) de l'organisateur pour une reunion.

    Appele par les ecrans de consentement (dictaphone et visio) avant de
    demarrer un enregistrement. C'est cette table, pas l'etat coche cote
    front, que le backend verifie ensuite (voir crud.require_consent) avant
    d'accepter /transcribe ou /visio/join.
    """
    meeting = get_owned_meeting(db, meeting_id, current_user.id)

    records = [
        models.ConsentRecord(
            meeting_id=meeting.id,
            user_id=current_user.id,
            consent_type=consent_type,
            consent_text_version=body.text_version,
            ip_address=request.client.host if request.client else None,
        )
        for consent_type in body.consent_types
    ]
    db.add_all(records)
    db.commit()
    for record in records:
        db.refresh(record)
    return records


@router.get("/by-share/{share_id}", response_model=MeetingOut)
def get_meeting_by_share(share_id: str, db: Session = Depends(get_db)) -> models.Meeting:
    meeting = (
        db.query(models.Meeting)
        .filter(models.Meeting.share_id == share_id, models.Meeting.deleted_at.is_(None))
        .first()
    )
    if not meeting:
        raise HTTPException(status_code=404, detail="not found")
    return meeting


@router.get("/{meeting_id}", response_model=MeetingOut)
def get_meeting(
    meeting_id: str,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> models.Meeting:
    return get_owned_meeting(db, meeting_id, current_user.id)


@router.patch("/{meeting_id}", response_model=MeetingOut)
def update_meeting(
    meeting_id: str,
    body: MeetingUpdate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> models.Meeting:
    """Renomme une reunion (seul champ modifiable pour l'instant depuis le dashboard)."""
    meeting = get_owned_meeting(db, meeting_id, current_user.id)
    title = body.title.strip()
    if title:
        meeting.title = title
    db.commit()
    db.refresh(meeting)
    return meeting


@router.delete("/{meeting_id}")
def delete_meeting(
    meeting_id: str,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict[str, bool]:
    meeting = get_owned_meeting(db, meeting_id, current_user.id)

    meeting.transcript = None
    meeting.cr = None
    meeting.title = "[réunion supprimée]"
    meeting.status = "ready"
    meeting.moderation = None
    meeting.classification = None
    meeting.deleted_at = datetime.now(timezone.utc)

    rgpd_entry = models.RgpdRequest(
        email=current_user.email,
        meeting_id=meeting_id,
        type="erasure",
    )
    db.add(rgpd_entry)
    db.commit()

    return {"ok": True}


@router.patch("/{meeting_id}/actions/{index}", response_model=MeetingOut)
def update_action(
    meeting_id: str,
    index: int,
    body: ActionUpdate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> models.Meeting:
    """Met a jour la priorite (P0-P5) et/ou le statut fait/a faire d'une action du CR.

    Les actions n'ont pas d'id propre : stockees dans le blob JSON Meeting.cr,
    elles sont adressees par leur index dans cr["actions"] (position stable
    tant que le CR n'est pas regenere). Reassigne meeting.cr en entier (plutot
    que de muter le dict en place) - necessaire pour que SQLAlchemy detecte le
    changement sur une colonne JSON simple (pas de tracking automatique des
    mutations internes).
    """
    meeting = get_owned_meeting(db, meeting_id, current_user.id)
    actions = (meeting.cr or {}).get("actions") if meeting.cr else None
    if not actions or not (0 <= index < len(actions)):
        raise HTTPException(status_code=404, detail="action introuvable")

    updated_actions = list(actions)
    updated_actions[index] = {**updated_actions[index], "priority": body.priority, "done": body.done}
    meeting.cr = {**meeting.cr, "actions": updated_actions}
    db.commit()
    db.refresh(meeting)
    return meeting
