"""Router d'export PDF des comptes-rendus Scribe.

Expose un endpoint GET /api/meetings/{meeting_id}/pdf qui genere un PDF
structure du compte-rendu d'une reunion a la volee via reportlab.
"""

import io
import logging
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import cm
from reportlab.platypus import (
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)
from sqlalchemy.orm import Session

import models
from crud import get_owned_meeting
from db import get_db
from deps import get_current_user
from schemas import MeetingCR

logger = logging.getLogger("ai-service.export")

router = APIRouter(tags=["export"])

# Palette de couleurs Scribe
_COLOR_PRIMARY = colors.HexColor("#1E40AF")  # bleu fonce
_COLOR_FLAG = colors.HexColor("#DC2626")  # rouge alerte
_COLOR_SECTION_BG = colors.HexColor("#EFF6FF")  # bleu tres clair
_COLOR_TABLE_HEADER = colors.HexColor("#3B82F6")  # bleu moyen
_COLOR_LIGHT_GREY = colors.HexColor("#F3F4F6")


def _build_pdf(meeting: models.Meeting) -> bytes:
    """Genere le contenu binaire du PDF pour une reunion.

    Args:
        meeting: Instance Meeting SQLAlchemy avec un champ `cr` non nul.

    Returns:
        Contenu PDF encode en bytes.
    """
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        leftMargin=2 * cm,
        rightMargin=2 * cm,
        topMargin=2.5 * cm,
        bottomMargin=2.5 * cm,
        title=f"Compte-rendu — {meeting.title}",
        author="Scribe",
        subject="Compte-rendu de reunion",
    )

    styles = getSampleStyleSheet()
    story: list = []

    # --- Styles personnalises ---
    style_title = ParagraphStyle(
        "ScribeTitle",
        parent=styles["Heading1"],
        fontSize=18,
        textColor=_COLOR_PRIMARY,
        spaceAfter=4,
        fontName="Helvetica-Bold",
    )
    style_meta = ParagraphStyle(
        "ScribeMeta",
        parent=styles["Normal"],
        fontSize=9,
        textColor=colors.HexColor("#6B7280"),
        spaceAfter=2,
    )
    style_section = ParagraphStyle(
        "ScribeSection",
        parent=styles["Heading2"],
        fontSize=13,
        textColor=_COLOR_PRIMARY,
        spaceBefore=14,
        spaceAfter=6,
        fontName="Helvetica-Bold",
        borderPad=4,
        backColor=_COLOR_SECTION_BG,
    )
    style_body = ParagraphStyle(
        "ScribeBody",
        parent=styles["Normal"],
        fontSize=10,
        leading=14,
        spaceAfter=4,
    )
    style_bullet = ParagraphStyle(
        "ScribeBullet",
        parent=style_body,
        leftIndent=16,
        bulletIndent=6,
        spaceAfter=3,
    )
    style_flag = ParagraphStyle(
        "ScribeFlag",
        parent=styles["Normal"],
        fontSize=10,
        textColor=_COLOR_FLAG,
        borderColor=_COLOR_FLAG,
        borderWidth=1,
        borderPad=6,
        backColor=colors.HexColor("#FEF2F2"),
        spaceAfter=10,
    )
    style_footer = ParagraphStyle(
        "ScribeFooter",
        parent=styles["Normal"],
        fontSize=8,
        textColor=colors.HexColor("#9CA3AF"),
        alignment=1,  # centre
    )

    cr = MeetingCR(**meeting.cr)

    # --- En-tete ---
    story.append(Paragraph(meeting.title, style_title))

    date_str = (
        meeting.date.strftime("%d/%m/%Y à %H:%M")
        if isinstance(meeting.date, datetime)
        else str(meeting.date)
    )
    duration_str = f"{meeting.duration_min} min" if meeting.duration_min else "durée inconnue"
    mode_label = "Visioconférence" if meeting.mode == "visio" else "Dictaphone"
    story.append(
        Paragraph(f"Date : {date_str} — Durée : {duration_str} — Mode : {mode_label}", style_meta)
    )
    story.append(Spacer(1, 6))

    # --- Badge moderation ---
    moderation = meeting.moderation or {}
    if moderation.get("flagged"):
        category = moderation.get("category") or "contenu signale"
        story.append(
            Paragraph(
                f"⚠ Contenu signalé par la modération : {category}",
                style_flag,
            )
        )

    # --- Résumé ---
    story.append(Paragraph("Résumé", style_section))
    story.append(Paragraph(cr.resume or "Aucun résumé disponible.", style_body))

    # --- Décisions ---
    story.append(Paragraph("Décisions", style_section))
    if cr.decisions:
        for decision in cr.decisions:
            story.append(Paragraph(f"• {decision}", style_bullet))
    else:
        story.append(Paragraph("Aucune décision enregistrée.", style_body))

    # --- Actions : tableau ---
    story.append(Paragraph("Actions", style_section))
    if cr.actions:
        table_data = [["Tâche", "Responsable"]]
        for action in cr.actions:
            table_data.append([action.text, action.owner])

        col_widths = [doc.width * 0.68, doc.width * 0.32]
        action_table = Table(table_data, colWidths=col_widths)
        action_table.setStyle(
            TableStyle(
                [
                    # En-tete
                    ("BACKGROUND", (0, 0), (-1, 0), _COLOR_TABLE_HEADER),
                    ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                    ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                    ("FONTSIZE", (0, 0), (-1, 0), 10),
                    ("BOTTOMPADDING", (0, 0), (-1, 0), 7),
                    ("TOPPADDING", (0, 0), (-1, 0), 7),
                    # Corps
                    ("FONTNAME", (0, 1), (-1, -1), "Helvetica"),
                    ("FONTSIZE", (0, 1), (-1, -1), 9),
                    ("TOPPADDING", (0, 1), (-1, -1), 5),
                    ("BOTTOMPADDING", (0, 1), (-1, -1), 5),
                    ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, _COLOR_LIGHT_GREY]),
                    # Bordures
                    ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#D1D5DB")),
                    ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ]
            )
        )
        story.append(action_table)
    else:
        story.append(Paragraph("Aucune action enregistrée.", style_body))

    # --- Themes ---
    story.append(Paragraph("Thèmes", style_section))
    if cr.themes:
        for theme in cr.themes:
            story.append(Paragraph(f"• {theme}", style_bullet))
    else:
        story.append(Paragraph("Aucun thème identifié.", style_body))

    # --- Classification IA (optionnelle) ---
    classification = meeting.classification
    if classification:
        story.append(Paragraph("Classification IA", style_section))
        tone = classification.get("tone", "—")
        urgency = classification.get("urgency", "—")
        story.append(
            Paragraph(f"Ton global : <b>{tone}</b> — Urgence : <b>{urgency}</b>", style_body)
        )

    # --- Pied de page ---
    story.append(Spacer(1, 20))
    story.append(Paragraph("Généré par Scribe — confidentiel", style_footer))

    doc.build(story)
    return buffer.getvalue()


@router.get("/meetings/{meeting_id}/pdf")
async def export_pdf(
    meeting_id: str,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> StreamingResponse:
    """Genere et retourne le PDF du compte-rendu d'une reunion.

    Args:
        meeting_id: Identifiant de la reunion dont on veut exporter le CR.
        current_user: Utilisateur authentifie (via cookie de session).
        db: Session SQLAlchemy injectee par dependance.

    Returns:
        StreamingResponse avec le PDF en binaire, content-type
        application/pdf et un header Content-Disposition d'attachement.

    Raises:
        HTTPException 404: Si la reunion est introuvable, n'appartient pas
            a l'utilisateur courant, ou si le compte-rendu est absent.
    """
    meeting = get_owned_meeting(db, meeting_id, current_user.id)

    if meeting.cr is None:
        raise HTTPException(
            status_code=404,
            detail="aucun compte-rendu disponible pour cette reunion",
        )

    pdf_bytes = _build_pdf(meeting)
    filename = f"CR_{meeting_id}.pdf"

    logger.info("[export] PDF genere pour meeting=%s (%d octets)", meeting_id, len(pdf_bytes))

    return StreamingResponse(
        io.BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
