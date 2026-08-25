from sqlalchemy.orm import Session

import models
from clients.vexa import join_bot


async def join_meeting(
    db: Session,
    meeting: models.Meeting,
    platform: str,
    native_meeting_id: str,
    bot_name: str | None = None,
) -> tuple[bool, str]:
    """Sequence commune "envoyer le bot Vexa + mettre a jour le Meeting".

    Partagee par le join manuel (routers/visio.py) et le join automatique
    declenche par le scheduler calendrier (scheduler.py), pour garantir un
    comportement identique entre les deux origines.
    """
    joined, source = await join_bot(platform, native_meeting_id, bot_name)

    meeting.platform = platform
    meeting.native_meeting_id = native_meeting_id
    meeting.source = source
    db.commit()

    return joined, source
