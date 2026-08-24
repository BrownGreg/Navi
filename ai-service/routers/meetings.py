from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

import models
from db import get_db
from deps import get_current_user
from schemas import MeetingCreate, MeetingOut

router = APIRouter(prefix="/meetings", tags=["meetings"])


@router.get("", response_model=list[MeetingOut])
def list_meetings(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[models.Meeting]:
    return (
        db.query(models.Meeting)
        .filter(models.Meeting.owner_id == current_user.id)
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


@router.get("/by-share/{share_id}", response_model=MeetingOut)
def get_meeting_by_share(share_id: str, db: Session = Depends(get_db)) -> models.Meeting:
    meeting = db.query(models.Meeting).filter(models.Meeting.share_id == share_id).first()
    if not meeting:
        raise HTTPException(status_code=404, detail="not found")
    return meeting


@router.get("/{meeting_id}", response_model=MeetingOut)
def get_meeting(
    meeting_id: str,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> models.Meeting:
    meeting = (
        db.query(models.Meeting)
        .filter(models.Meeting.id == meeting_id, models.Meeting.owner_id == current_user.id)
        .first()
    )
    if not meeting:
        raise HTTPException(status_code=404, detail="not found")
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

    rgpd_entry = models.RgpdRequest(
        email=current_user.email,
        meeting_id=meeting_id,
        type="erasure",
    )
    db.add(rgpd_entry)
    db.commit()

    return {"ok": True}
