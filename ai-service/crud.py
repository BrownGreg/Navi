from fastapi import HTTPException
from sqlalchemy.orm import Session

import models
from schemas import ConsentType


def get_owned_meeting(db: Session, meeting_id: str, owner_id: str) -> models.Meeting:
    meeting = (
        db.query(models.Meeting)
        .filter(models.Meeting.id == meeting_id, models.Meeting.owner_id == owner_id)
        .first()
    )
    if not meeting:
        raise HTTPException(status_code=404, detail="reunion introuvable")
    return meeting


def require_consent(db: Session, meeting_id: str, required_types: frozenset[ConsentType]) -> None:
    """Bloque le traitement (transcription/join visio) sans ConsentRecord valide.

    Verification serveur volontairement independante de l'UI : un etat React
    (cases cochees) ne prouve rien si l'appel API peut etre declenche sans
    passer par le formulaire (ex: replay/curl direct). Le seul etat qui
    compte est ce qui a ete effectivement persiste en base via
    POST /meetings/{id}/consent.

    ``required_types`` est fourni explicitement par l'appelant (pas de
    defaut global) : le dictaphone et le visio n'affichent pas les memes
    cases a l'utilisateur, donc ne doivent pas exiger le meme sous-ensemble
    - voir schemas.DICTAPHONE_REQUIRED_CONSENT / VISIO_REQUIRED_CONSENT.
    """
    granted = {
        row[0]
        for row in db.query(models.ConsentRecord.consent_type)
        .filter(models.ConsentRecord.meeting_id == meeting_id)
        .all()
    }
    missing = required_types - granted
    if missing:
        raise HTTPException(
            status_code=403,
            detail=f"consentement manquant pour : {', '.join(sorted(missing))}",
        )
