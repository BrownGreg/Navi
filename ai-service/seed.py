"""Cree un compte-rendu d'exemple accessible sans compte, pour /cr/shr-seed1
(lien "Voir un exemple de compte-rendu sans compte" sur l'ecran de
consentement participant).

Idempotent et appele a chaque demarrage (voir db.init_db) : survit a une
reinitialisation de base (recreation de service, changement de provider
Postgres, etc.) sans intervention manuelle, plutot que de dependre d'un
fichier de seed statique jamais charge (cf. l'ancien data/meetings.json).
"""

import uuid

from sqlalchemy.orm import Session

import models
from security import hash_password

DEMO_USER_EMAIL = "demo@navi.app"
DEMO_SHARE_ID = "shr-seed1"

_DEMO_TRANSCRIPT = [
    {
        "speaker": "Sam",
        "text": "Bonjour a tous, on demarre. L'objectif aujourd'hui est de faire le point sur le lancement de la version beta.",
        "start": 0.0,
        "end": 5.2,
    },
    {
        "speaker": "Alex",
        "text": "Cote technique, le pipeline de transcription et de generation du compte-rendu est stable depuis une semaine.",
        "start": 5.8,
        "end": 11.4,
    },
    {
        "speaker": "Sam",
        "text": "Parfait. Est-ce qu'on est prets a ouvrir l'inscription publique ?",
        "start": 12.0,
        "end": 14.5,
    },
    {
        "speaker": "Alex",
        "text": "Oui, il reste juste a finaliser la documentation utilisateur avant vendredi.",
        "start": 15.1,
        "end": 18.9,
    },
    {
        "speaker": "Sam",
        "text": "Ok, je m'occupe de la documentation. On se revoit vendredi pour valider.",
        "start": 19.4,
        "end": 23.0,
    },
]

_DEMO_CR = {
    "resume": (
        "Point d'avancement sur le lancement de la version beta : le pipeline technique "
        "(transcription, generation de compte-rendu) est stable depuis une semaine. Il reste "
        "a finaliser la documentation utilisateur avant l'ouverture de l'inscription publique."
    ),
    "decisions": ["Ouvrir l'inscription publique une fois la documentation finalisee"],
    "actions": [{"text": "Finaliser la documentation utilisateur", "owner": "Sam"}],
    "themes": ["Lancement produit", "Documentation"],
}

_DEMO_CLASSIFICATION = {
    "tone": "neutre",
    "urgency": "normale",
    "themes": ["Lancement produit", "Documentation"],
    "per_segment": [],
}


def seed_demo_meeting(db: Session) -> None:
    """Cree ou met a jour l'exemple demo (upsert, pas juste create-if-missing) :
    si le contenu de ce fichier change (ex: correction d'un champ mal
    forme), la ligne deja en base doit se corriger toute seule au prochain
    demarrage plutot que de rester figee sur une version buguee - c'est
    arrive une fois (per_segment mal orthographie), d'ou ce choix."""
    meeting = db.query(models.Meeting).filter(models.Meeting.share_id == DEMO_SHARE_ID).first()

    if meeting is None:
        user = db.query(models.User).filter(models.User.email == DEMO_USER_EMAIL).first()
        if not user:
            # Mot de passe aleatoire jamais communique : ce compte n'existe
            # que pour satisfaire la FK owner_id, il n'est jamais cense
            # etre utilise pour se connecter (l'exemple est consulte via le
            # lien public /cr/shr-seed1, qui ne necessite pas d'auth).
            user = models.User(email=DEMO_USER_EMAIL, password_hash=hash_password(uuid.uuid4().hex))
            db.add(user)
            db.flush()
        meeting = models.Meeting(owner_id=user.id, share_id=DEMO_SHARE_ID)
        db.add(meeting)

    meeting.title = "Point hebdomadaire - lancement beta"
    meeting.mode = "dictaphone"
    meeting.status = "ready"
    meeting.source = "mock"
    # Duree de conservation volontairement tres elevee : c'est un exemple
    # permanent, pas une vraie reunion, il ne doit jamais etre anonymise par
    # la purge RGPD automatique (scheduler.purge_expired_meetings).
    meeting.retention_days = 36500
    meeting.duration_min = 1
    meeting.transcript = _DEMO_TRANSCRIPT
    meeting.cr = _DEMO_CR
    meeting.moderation = {"flagged": False, "source": "mock"}
    meeting.classification = _DEMO_CLASSIFICATION

    db.commit()
