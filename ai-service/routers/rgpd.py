from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

import models
from db import get_db
from schemas import RgpdRequestIn, RgpdRequestOut

# Public, sans auth, par choix delibere : les participants sans compte
# doivent pouvoir exercer leurs droits RGPD.
router = APIRouter(tags=["rgpd"])


@router.post("/rgpd-request", response_model=RgpdRequestOut)
def create_rgpd_request(body: RgpdRequestIn, db: Session = Depends(get_db)) -> models.RgpdRequest:
    entry = models.RgpdRequest(email=body.email, meeting_id=body.meeting_id, type=body.type)
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry
