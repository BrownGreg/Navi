"""Router de classification IA des reunions Scribe.

Expose un endpoint POST /api/classify qui analyse la transcription d'une
reunion et stocke le resultat de classification (ton, urgence, themes) dans
le champ `classification` du modele Meeting.
"""

import logging

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

import models
from clients.classifier import classify
from crud import get_owned_meeting
from db import get_db
from deps import get_current_user
from schemas import ClassifyRequest, ClassifyResponse, TranscriptSegment

logger = logging.getLogger("ai-service.classify")

router = APIRouter(prefix="/classify", tags=["classify"])


@router.post("", response_model=ClassifyResponse)
async def classify_meeting(
    body: ClassifyRequest,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ClassifyResponse:
    """Classifie la transcription d'une reunion et stocke le resultat.

    Recupere la transcription de la reunion identifiee par `meeting_id`,
    appelle le client Kimi K3 pour en extraire le ton global, l'urgence et
    les themes, puis persiste le resultat dans `meeting.classification`.

    Args:
        body: Requete contenant le `meeting_id` a classifier.
        current_user: Utilisateur authentifie (via cookie de session).
        db: Session SQLAlchemy injectee par dependance.

    Returns:
        ClassifyResponse avec la classification et la source ("real" ou "mock").

    Raises:
        HTTPException 404: Si la reunion est introuvable ou n'appartient pas
            a l'utilisateur courant.
        HTTPException 422: Si la reunion ne possede pas encore de transcription.
    """
    meeting = get_owned_meeting(db, body.meeting_id, current_user.id)

    if not meeting.transcript:
        raise HTTPException(
            status_code=422,
            detail="cette reunion ne possede pas encore de transcription",
        )

    segments = [TranscriptSegment(**seg) for seg in meeting.transcript]

    classification, source = await classify(segments)

    meeting.classification = classification.model_dump()
    db.commit()

    logger.info(
        "[classify] meeting=%s tone=%s urgency=%s source=%s",
        body.meeting_id,
        classification.tone,
        classification.urgency,
        source,
    )

    return ClassifyResponse(classification=classification, source=source)
