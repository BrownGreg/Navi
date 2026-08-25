from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from clients.meeting_url import resolve_meeting_url
from clients.safeguard import moderate as run_moderation
from clients.vexa import get_transcript, leave_bot
from crud import get_owned_meeting
from db import get_db
from deps import get_current_user
import models
from schemas import (
    VisioJoinRequest,
    VisioJoinResponse,
    VisioLeaveRequest,
    VisioResolveRequest,
    VisioResolveResponse,
    VisioTranscriptResponse,
)
from services.visio_join import join_meeting

router = APIRouter(prefix="/visio", tags=["visio"])

# meeting_id est desormais l'id interne du Meeting (plus la cle composite
# "platform:native_meeting_id") : ai-service resout platform/native_meeting_id
# depuis sa propre ligne DB, cette traduction ne vit plus cote Next.js.


@router.post("/join", response_model=VisioJoinResponse)
async def visio_join(
    body: VisioJoinRequest,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> VisioJoinResponse:
    meeting = get_owned_meeting(db, body.meeting_id, current_user.id)

    joined, source = await join_meeting(db, meeting, body.platform, body.native_meeting_id, body.bot_name)

    return VisioJoinResponse(joined=joined, source=source)


@router.post("/resolve-url", response_model=VisioResolveResponse)
async def visio_resolve_url(
    body: VisioResolveRequest,
    current_user: models.User = Depends(get_current_user),
) -> VisioResolveResponse:
    # Pas de notion de proprietaire ici : aucun Meeting n'existe encore a ce
    # stade, get_current_user ne sert que de garde-fou anti-abus.
    platform, native_meeting_id = await resolve_meeting_url(body.url.strip())
    return VisioResolveResponse(
        resolved=platform is not None and native_meeting_id is not None,
        platform=platform,
        native_meeting_id=native_meeting_id,
    )


@router.get("/{meeting_id}/transcript", response_model=VisioTranscriptResponse)
def visio_transcript(
    meeting_id: str,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> VisioTranscriptResponse:
    meeting = get_owned_meeting(db, meeting_id, current_user.id)
    if not meeting.platform or not meeting.native_meeting_id:
        raise HTTPException(status_code=404, detail="reunion visio introuvable")

    segments, source, live = get_transcript(meeting.platform, meeting.native_meeting_id)
    return VisioTranscriptResponse(segments=segments, source=source, live=live)


@router.post("/{meeting_id}/leave", response_model=VisioTranscriptResponse)
async def visio_leave(
    meeting_id: str,
    body: VisioLeaveRequest,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> VisioTranscriptResponse:
    meeting = get_owned_meeting(db, meeting_id, current_user.id)
    if not meeting.platform or not meeting.native_meeting_id:
        raise HTTPException(status_code=404, detail="reunion visio introuvable")

    segments, source = await leave_bot(meeting.platform, meeting.native_meeting_id)
    moderation = await run_moderation(segments)

    meeting.transcript = [s.model_dump() for s in segments]
    meeting.duration_min = body.duration_min or max(1, meeting.duration_min)
    meeting.source = source
    meeting.moderation = moderation.model_dump()
    db.commit()

    return VisioTranscriptResponse(segments=segments, source=source, live=False)
