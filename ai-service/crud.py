from datetime import datetime, timezone

from fastapi import HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session

import config
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


def require_within_quota(
    db: Session, owner_id: str, mode: str, additional_minutes: float = 0.0
) -> None:
    """Bloque un traitement facture a l'usage si le plafond mensuel serait depasse.

    Calcule le cout reel estime (meme methode que rapport_technique.md §8) des
    reunions du mois calendaire en cours pour ce compte a partir de
    Meeting.duration_min, ajoute le cout projete de la reunion en cours
    (``additional_minutes`` - 0 pour le visio, dont la duree n'est pas connue
    avant le join : voir services/visio_join.join_meeting, qui verifie donc
    seulement si le plafond est deja atteint AVANT de demarrer un nouveau bot,
    pas la duree de la reunion a venir), et rejette si le total depasse
    config.MONTHLY_USAGE_CAP_USD.

    Plafond en cout cumule (donc en duree ponderee par mode, dictaphone et
    visio n'ayant pas le meme cout/heure), pas en nombre de reunions : une
    minorite de reunions tres longues echapperait a un plafond par nombre
    (cf. rapport §8).
    """
    month_start = datetime.now(timezone.utc).replace(
        day=1, hour=0, minute=0, second=0, microsecond=0
    )

    rows = (
        db.query(models.Meeting.mode, func.sum(models.Meeting.duration_min))
        .filter(models.Meeting.owner_id == owner_id, models.Meeting.date >= month_start)
        .group_by(models.Meeting.mode)
        .all()
    )
    minutes_by_mode = {row_mode: total or 0 for row_mode, total in rows}

    cost_so_far = (
        minutes_by_mode.get("dictaphone", 0) * config.VOXTRAL_COST_PER_MINUTE_USD
        + minutes_by_mode.get("visio", 0) / 60 * config.VEXA_COST_PER_HOUR_USD
    )
    per_minute_cost = (
        config.VOXTRAL_COST_PER_MINUTE_USD
        if mode == "dictaphone"
        else config.VEXA_COST_PER_HOUR_USD / 60
    )
    projected_cost = cost_so_far + additional_minutes * per_minute_cost

    if projected_cost > config.MONTHLY_USAGE_CAP_USD:
        raise HTTPException(
            status_code=402,
            detail=(
                "plafond d'usage mensuel atteint pour la formule Pro (cout reel estime "
                f"${projected_cost:.2f} / ${config.MONTHLY_USAGE_CAP_USD:.2f}) — "
                "contactez-nous pour la formule Equipe"
            ),
        )
