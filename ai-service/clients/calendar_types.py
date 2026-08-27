from dataclasses import dataclass
from datetime import datetime


@dataclass
class TokenSet:
    access_token: str
    refresh_token: (
        str | None
    )  # absent sur une reponse de refresh Google : l'appelant garde l'ancien
    expires_at: datetime
    account_email: str | None = None


@dataclass
class CalendarEvent:
    external_id: str
    title: str
    start_time: datetime
    meeting_url: str | None
