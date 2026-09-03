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


ActionPriority = Literal["P0", "P1", "P2", "P3", "P4", "P5"]


class CRAction(BaseModel):
    text: str
    owner: str
    priority: Optional[ActionPriority] = None
    done: bool = False


class MeetingCR(BaseModel):
    resume: str
    decisions: list[str]
    actions: list[CRAction]
    themes: list[str]


class ActionUpdate(CamelModel):
    priority: Optional[ActionPriority] = None
    done: bool = False


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


class VisioResolveRequest(CamelModel):
    url: str


class VisioResolveResponse(CamelModel):
    resolved: bool
    platform: Optional[Platform] = None
    native_meeting_id: Optional[str] = None


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


class MeetingUpdate(CamelModel):
    title: str


class ProjectOut(CamelModel):
    id: str
    name: str


class ProjectCreate(CamelModel):
    name: str


class ProjectAssign(CamelModel):
    project_id: Optional[str] = None


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
    classification: Optional["ClassificationResult"] = None
    project: Optional[ProjectOut] = None


# --- Classification ---


class SegmentClassification(BaseModel):
    speaker: str
    theme: str
    tone: str


class ClassificationResult(BaseModel):
    tone: str
    urgency: str
    themes: list[str]
    per_segment: list[SegmentClassification]


class ClassifyRequest(CamelModel):
    meeting_id: str


class ClassifyResponse(BaseModel):
    classification: ClassificationResult
    source: Source


# --- Calendrier (auto-join) ---

CalendarProvider = Literal["google", "microsoft"]


class CalendarConnectionOut(CamelModel):
    provider: CalendarProvider
    connected: bool
    account_email: Optional[str] = None
    needs_reauth: bool = False
    connected_at: Optional[datetime] = None


class UpcomingCalendarEventOut(CamelModel):
    title: str
    provider: CalendarProvider
    start_time: datetime
    platform: Optional[Platform] = None


# --- Consentement ---

ConsentType = Literal["oral_recording", "transcript", "ai_processing", "participant_sharing"]

# Requis different par mode : le formulaire dictaphone n'affiche que 2 cases
# (oral_recording, transcript), le formulaire visio en affiche 4 (les memes
# + ai_processing + participant_sharing). Un seul jeu global aurait laisse
# ai_processing/participant_sharing cochables sans jamais etre verifies cote
# serveur pour /visio/join - meme defaut que les <div> statiques d'origine
# qu'on corrige ici, donc chaque flux doit exiger exactement ce qu'il affiche.
DICTAPHONE_REQUIRED_CONSENT: frozenset[ConsentType] = frozenset({"oral_recording", "transcript"})
VISIO_REQUIRED_CONSENT: frozenset[ConsentType] = frozenset(
    {"oral_recording", "transcript", "ai_processing", "participant_sharing"}
)

# Version du texte de consentement actuellement affiche sur les ecrans
# dictaphone/visio (app/new/*/consent/page.tsx). A incrementer manuellement
# ET a la main dans ces deux fichiers des que la formulation change - c'est
# ce qui rend consent_text_version tracable plutot qu'un simple placeholder :
# sans ca, un changement de texte ne laisserait aucune trace differente en
# base entre un consentement donne sous l'ancienne et la nouvelle formulation.
CURRENT_CONSENT_TEXT_VERSION = "2026-08-29-v1"


class ConsentGrantRequest(CamelModel):
    consent_types: list[ConsentType]
    text_version: str = CURRENT_CONSENT_TEXT_VERSION


class ConsentRecordOut(CamelModel):
    id: str
    meeting_id: str
    consent_type: ConsentType
    granted_at: datetime
    consent_text_version: str


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
