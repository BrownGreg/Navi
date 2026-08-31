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
    compte Navi doivent pouvoir exercer leurs droits.

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
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[models.RgpdRequest]:
    """Liste les demandes RGPD concernant les reunions de l'utilisateur connecte.

    Protege par authentification ET filtre par propriete : RgpdRequest n'a pas
    de ForeignKey vers Meeting (par choix - cf. le modele - pour survivre a
    une eventuelle suppression du meeting), donc rien n'empeche par construction
    qu'une demande reference un meeting_id appartenant a un autre organisateur.
    Sans ce filtre, n'importe quel utilisateur connecte pourrait lister les
    demandes RGPD (email inclus) de tous les autres organisateurs.

    Args:
        current_user: Utilisateur authentifie (via cookie de session).
        db: Session SQLAlchemy injectee par dependance.

    Returns:
        Les RgpdRequest dont le meeting_id correspond a une reunion possedee
        par current_user, les plus recentes en premier. Une demande dont le
        meeting_id ne correspond a aucune reunion existante (faute de frappe
        du participant, etc.) n'apparait pour personne - toujours stockee,
        simplement pas rattachable a un organisateur pour l'instant.
    """
    owned_meeting_ids = [
        row[0]
        for row in db.query(models.Meeting.id)
        .filter(models.Meeting.owner_id == current_user.id)
        .all()
    ]
    return (
        db.query(models.RgpdRequest)
        .filter(models.RgpdRequest.meeting_id.in_(owned_meeting_ids))
        .order_by(models.RgpdRequest.created_at.desc())
        .all()
    )
