from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from clients.mistral_cr import generate_cr as run_generate_cr
from crud import get_owned_meeting
from db import get_db
from deps import get_current_user
import models
from schemas import GenerateCRRequest, GenerateCRResponse, TranscriptSegment

router = APIRouter(tags=["generate-cr"])


@router.post("/generate-cr", response_model=GenerateCRResponse)
async def generate_cr(
    body: GenerateCRRequest,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> GenerateCRResponse:
    meeting = get_owned_meeting(db, body.meeting_id, current_user.id)
    if not meeting.transcript:
        raise HTTPException(status_code=404, detail="reunion ou transcription introuvable")

    transcript = [TranscriptSegment(**s) for s in meeting.transcript]
    cr, source = await run_generate_cr(transcript)

    meeting.cr = cr.model_dump()
    meeting.status = "ready"
    # "real" seulement si la transcription ET la generation de CR ont toutes
    # les deux appele une vraie API - un seul badge pour ces deux etapes, il
    # ne doit pas afficher "reelle" si l'une des deux est retombee en mock.
    meeting.source = "real" if source == "real" and meeting.source == "real" else "mock"
    db.commit()

    return GenerateCRResponse(cr=cr, source=source)
