from fastapi import HTTPException
from sqlalchemy.orm import Session

import models


def get_owned_meeting(db: Session, meeting_id: str, owner_id: str) -> models.Meeting:
    meeting = (
        db.query(models.Meeting)
        .filter(models.Meeting.id == meeting_id, models.Meeting.owner_id == owner_id)
        .first()
    )
    if not meeting:
        raise HTTPException(status_code=404, detail="reunion introuvable")
    return meeting
