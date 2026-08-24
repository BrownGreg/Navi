from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel, ConfigDict
from pydantic.alias_generators import to_camel

Source = Literal["real", "mock"]


class CamelModel(BaseModel):
    """Base pour les schemas exposes sur le fil en camelCase (attendu par le
    frontend Next.js) tout en gardant du snake_case idiomatique cote Python."""

    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True, from_attributes=True)


class TranscriptSegment(BaseModel):
    speaker: str
    text: str
    start: float = 0
    end: Optional[float] = None


class ModerateResponse(BaseModel):
    flagged: bool
    category: Optional[str] = None
    rationale: Optional[str] = None
    source: Source


class ModerateRequest(BaseModel):
    transcript: list[TranscriptSegment]


class TranscribeResponse(BaseModel):
    segments: list[TranscriptSegment]
    source: Source
    moderation: Optional[ModerateResponse] = None


class CRAction(BaseModel):
    text: str
    owner: str


class MeetingCR(BaseModel):
    resume: str
    decisions: list[str]
    actions: list[CRAction]
    themes: list[str]


class GenerateCRRequest(CamelModel):
    meeting_id: str


class GenerateCRResponse(BaseModel):
    cr: MeetingCR
    source: Source


Platform = Literal["google_meet", "teams", "zoom"]


class VisioJoinRequest(CamelModel):
    meeting_id: str
    platform: Platform
    native_meeting_id: str
    bot_name: Optional[str] = None


class VisioJoinResponse(BaseModel):
    joined: bool
    source: Source


class VisioLeaveRequest(CamelModel):
    duration_min: Optional[int] = None


class VisioTranscriptResponse(BaseModel):
    segments: list[TranscriptSegment]
    source: Source
    live: bool


class HealthResponse(BaseModel):
    status: Literal["ok"]
    providers: dict[str, bool]


# --- Auth ---


class SignupRequest(BaseModel):
    email: str
    password: str


class SigninRequest(BaseModel):
    email: str
    password: str


class UserOut(CamelModel):
    id: str
    email: str


# --- Meetings ---

MeetingMode = Literal["visio", "dictaphone"]
MeetingStatus = Literal["processing", "ready"]


class MeetingCreate(CamelModel):
    title: str
    mode: MeetingMode = "dictaphone"
    retention_days: int = 30


class MeetingOut(CamelModel):
    id: str
    share_id: str
    title: str
    mode: MeetingMode
    date: datetime
    duration_min: int
    status: MeetingStatus
    source: Source
    retention_days: int
    transcript: Optional[list[TranscriptSegment]] = None
    cr: Optional[MeetingCR] = None
    platform: Optional[Platform] = None
    native_meeting_id: Optional[str] = None
    moderation: Optional[ModerateResponse] = None


# --- RGPD ---

RgpdRequestType = Literal["access", "rectification", "erasure"]


class RgpdRequestIn(CamelModel):
    email: str
    meeting_id: str
    type: RgpdRequestType


class RgpdRequestOut(CamelModel):
    id: str
    email: str
    meeting_id: str
    type: RgpdRequestType
    created_at: datetime
