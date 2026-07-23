from typing import Literal, Optional

from pydantic import BaseModel

Source = Literal["real", "mock"]


class TranscriptSegment(BaseModel):
    speaker: str
    text: str
    start: float = 0
    end: Optional[float] = None


class TranscribeResponse(BaseModel):
    segments: list[TranscriptSegment]
    source: Source


class CRAction(BaseModel):
    text: str
    owner: str


class MeetingCR(BaseModel):
    resume: str
    decisions: list[str]
    actions: list[CRAction]
    themes: list[str]


class GenerateCRRequest(BaseModel):
    transcript: list[TranscriptSegment]


class GenerateCRResponse(BaseModel):
    cr: MeetingCR
    source: Source


class ModerateRequest(BaseModel):
    transcript: list[TranscriptSegment]


class ModerateResponse(BaseModel):
    flagged: bool
    category: Optional[str] = None
    rationale: Optional[str] = None
    source: Source


Platform = Literal["google_meet", "teams", "zoom"]


class VisioJoinRequest(BaseModel):
    platform: Platform
    native_meeting_id: str
    bot_name: Optional[str] = None


class VisioJoinResponse(BaseModel):
    joined: bool
    source: Source


class VisioTranscriptResponse(BaseModel):
    segments: list[TranscriptSegment]
    source: Source
    live: bool


class HealthResponse(BaseModel):
    status: Literal["ok"]
    providers: dict[str, bool]
