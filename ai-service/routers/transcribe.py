from fastapi import APIRouter, Depends, File, Form, UploadFile
from sqlalchemy.orm import Session

import models
from clients.moderation import moderate as run_moderation
from clients.voxtral import transcribe_audio
from crud import get_owned_meeting, require_consent
from db import get_db
from deps import get_current_user
from schemas import DICTAPHONE_REQUIRED_CONSENT, TranscribeResponse

router = APIRouter(tags=["transcribe"])


@router.post("/transcribe", response_model=TranscribeResponse)
async def transcribe_dictaphone(
    audio: UploadFile = File(...),
    meeting_id: str = Form(alias="meetingId"),
    duration_sec: float = Form(default=0, alias="durationSec"),
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> TranscribeResponse:
    meeting = get_owned_meeting(db, meeting_id, current_user.id)
    require_consent(db, meeting.id, DICTAPHONE_REQUIRED_CONSENT)

    audio_bytes = await audio.read()
    segments, source = await transcribe_audio(audio_bytes, audio.content_type or "audio/webm")
    moderation = await run_moderation(segments)

    meeting.transcript = [s.model_dump() for s in segments]
    meeting.duration_min = max(1, round(duration_sec / 60))
    meeting.source = source
    meeting.moderation = moderation.model_dump()
    db.commit()

    return TranscribeResponse(segments=segments, source=source, moderation=moderation)
