from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

import models
from db import get_db
from deps import get_current_user
from schemas import RgpdRequestIn, RgpdRequestOut

# Public, sans auth, par choix delibere : les participants sans compte
# doivent pouvoir exercer leurs droits RGPD.
router = APIRouter(tags=["rgpd"])


@router.post("/rgpd-request", response_model=RgpdRequestOut)
def create_rgpd_request(body: RgpdRequestIn, db: Session = Depends(get_db)) -> models.RgpdRequest:
    """Enregistre une demande RGPD (acces, rectification, effacement).

    Endpoint public intentionnellement : les participants a une reunion sans
    compte Scribe doivent pouvoir exercer leurs droits.

    Args:
        body: Donnees de la demande (email, meeting_id, type).
        db: Session SQLAlchemy injectee par dependance.

    Returns:
        La demande RGPD creee avec son identifiant et sa date de creation.
    """
    entry = models.RgpdRequest(email=body.email, meeting_id=body.meeting_id, type=body.type)
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry


@router.get("/rgpd-requests", response_model=list[RgpdRequestOut])
def list_rgpd_requests(
    current_user: models.User = Depends(get_current_user),  # noqa: ARG001
    db: Session = Depends(get_db),
) -> list[models.RgpdRequest]:
    """Liste toutes les demandes RGPD en base (vue admin).

    Protege par authentification : seuls les utilisateurs connectes peuvent
    consulter le registre des demandes.

    Args:
        current_user: Utilisateur authentifie (via cookie de session).
        db: Session SQLAlchemy injectee par dependance.

    Returns:
        Liste de toutes les RgpdRequest enregistrees, toutes origines confondues.
    """
    return db.query(models.RgpdRequest).order_by(models.RgpdRequest.created_at.desc()).all()
