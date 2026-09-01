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
    "perSegment": [],
}


def seed_demo_meeting(db: Session) -> None:
    existing = db.query(models.Meeting).filter(models.Meeting.share_id == DEMO_SHARE_ID).first()
    if existing:
        return

    user = db.query(models.User).filter(models.User.email == DEMO_USER_EMAIL).first()
    if not user:
        # Mot de passe aleatoire jamais communique : ce compte n'existe que
        # pour satisfaire la FK owner_id, il n'est jamais cense etre utilise
        # pour se connecter (l'exemple est consulte via le lien public
        # /cr/shr-seed1, qui ne necessite pas d'authentification).
        user = models.User(email=DEMO_USER_EMAIL, password_hash=hash_password(uuid.uuid4().hex))
        db.add(user)
        db.flush()

    meeting = models.Meeting(
        owner_id=user.id,
        share_id=DEMO_SHARE_ID,
        title="Point hebdomadaire - lancement beta",
        mode="dictaphone",
        status="ready",
        source="mock",
        # Duree de conservation volontairement tres elevee : c'est un exemple
        # permanent, pas une vraie reunion, il ne doit jamais etre anonymise
        # par la purge RGPD automatique (scheduler.purge_expired_meetings).
        retention_days=36500,
        duration_min=1,
        transcript=_DEMO_TRANSCRIPT,
        cr=_DEMO_CR,
        moderation={"flagged": False, "source": "mock"},
        classification=_DEMO_CLASSIFICATION,
    )
    db.add(meeting)
    db.commit()
