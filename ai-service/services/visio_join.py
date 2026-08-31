from sqlalchemy.orm import Session

import models
from clients.vexa import join_bot

# Nom affiche par defaut du bot dans la liste des participants de la reunion
# (Meet/Teams/Zoom) - seul signal reellement visible par les participants
# qu'un enregistrement est en cours, l'API Vexa publique verifiee (cf.
# clients/vexa.py) n'exposant pas d'envoi de message dans le chat de reunion.
DEFAULT_BOT_NAME = "Navi Notetaker — enregistrement"


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
    effective_bot_name = bot_name or DEFAULT_BOT_NAME
    joined, source = await join_bot(platform, native_meeting_id, effective_bot_name)

    meeting.platform = platform
    meeting.native_meeting_id = native_meeting_id
    meeting.source = source

    # Trace de conformite : uniquement quand un bot reel a effectivement
    # rejoint (pas en mode mock, ou personne n'est notifie pour de vrai).
    if joined and source == "real":
        db.add(
            models.ParticipantNotification(
                meeting_id=meeting.id,
                channel="vexa_bot_display_name",
                detail=(
                    f"Bot '{effective_bot_name}' visible dans la liste des participants "
                    "(pas de message de chat : non supporte par l'API Vexa publique)."
                ),
            )
        )

    db.commit()

    return joined, source
