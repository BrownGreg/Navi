from fastapi import APIRouter, HTTPException

from clients.vexa import get_transcript, join_bot, leave_bot
from schemas import VisioJoinRequest, VisioJoinResponse, VisioTranscriptResponse

router = APIRouter()

# meeting_id expose aux appelants (Node) est une cle composite "platform:native_meeting_id"
# pour rester sur un seul path param comme suggere par la consigne initiale
# (GET /visio/{meeting_id}/transcript), tout en adressant Vexa avec la paire
# platform + native_meeting_id qu'il attend reellement.


def _split_meeting_id(meeting_id: str) -> tuple[str, str]:
    if ":" not in meeting_id:
        raise HTTPException(status_code=400, detail="meeting_id doit avoir la forme 'platform:native_meeting_id'")
    platform, native_meeting_id = meeting_id.split(":", 1)
    return platform, native_meeting_id


@router.post("/visio/join", response_model=VisioJoinResponse)
async def visio_join(body: VisioJoinRequest):
    joined, source = await join_bot(body.platform, body.native_meeting_id, body.bot_name)
    return VisioJoinResponse(joined=joined, source=source)


@router.get("/visio/{meeting_id}/transcript", response_model=VisioTranscriptResponse)
async def visio_transcript(meeting_id: str):
    platform, native_meeting_id = _split_meeting_id(meeting_id)
    segments, source, live = get_transcript(platform, native_meeting_id)
    return VisioTranscriptResponse(segments=segments, source=source, live=live)


@router.post("/visio/{meeting_id}/leave", response_model=VisioTranscriptResponse)
async def visio_leave(meeting_id: str):
    platform, native_meeting_id = _split_meeting_id(meeting_id)
    segments, source = await leave_bot(platform, native_meeting_id)
    return VisioTranscriptResponse(segments=segments, source=source, live=False)
