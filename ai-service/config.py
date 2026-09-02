import os
from pathlib import Path

from dotenv import load_dotenv

# Le service Python et l'app Next.js partagent le meme fichier d'env a la
# racine du repo (convention .env.local de Next.js), pour n'avoir qu'une
# seule source de verite pour les cles API (cf. .env.example a la racine).
_ROOT = Path(__file__).resolve().parent.parent
load_dotenv(_ROOT / ".env.local")
load_dotenv(_ROOT / ".env")

MISTRAL_API_KEY = os.environ.get("MISTRAL_API_KEY")
VEXA_API_KEY = os.environ.get("VEXA_API_KEY")
VEXA_BASE_URL = os.environ.get("VEXA_BASE_URL", "https://api.cloud.vexa.ai")

MISTRAL_TRANSCRIBE_URL = "https://api.mistral.ai/v1/audio/transcriptions"
MISTRAL_CHAT_URL = "https://api.mistral.ai/v1/chat/completions"
MISTRAL_MODERATION_URL = "https://api.mistral.ai/v1/moderations"
# Meme cle MISTRAL_API_KEY pour la transcription (Voxtral), la generation du
# CR, la classification et desormais la moderation (Mistral Moderation 2) :
# un seul fournisseur/compte a gerer (remplace l'ancienne integration Kimi K3
# / Moonshot AI, hors UE, et gpt-oss-safeguard-20b via Groq - cf.
# rapport_technique.md pour l'historique de ces decisions).
MISTRAL_CHAT_MODEL = os.environ.get("MISTRAL_CHAT_MODEL", "mistral-small-latest")
MISTRAL_MODERATION_MODEL = os.environ.get("MISTRAL_MODERATION_MODEL", "mistral-moderation-2603")

# Sous-traitant de secours (Scaleway, France/UE - cf. clients/scaleway.py) pour
# la generation du CR et la classification uniquement : si l'appel Mistral
# echoue, ces deux clients retentent via Scaleway avant de basculer sur le
# mock. Choisi pour rester sur un nombre volontairement limite de
# sous-traitants, tous en UE (cf. argument de conformite de la landing page) -
# pas de troisieme fournisseur hors UE. N'est jamais sollicite si
# SCALEWAY_API_KEY est absente : comportement strictement identique a avant
# dans ce cas (voir .env.example). La transcription (Voxtral, dictaphone)
# n'a volontairement pas ce fallback ici : voir le commentaire en tete de
# clients/voxtral.py pour le choix (auto-hebergement plutot qu'un deuxieme
# sous-traitant tiers) et son etat non fonctionnel actuel.
SCALEWAY_API_KEY = os.environ.get("SCALEWAY_API_KEY")
SCALEWAY_CHAT_URL = "https://api.scaleway.ai/v1/chat/completions"
SCALEWAY_CHAT_MODEL = os.environ.get("SCALEWAY_CHAT_MODEL", "mistral-small-3.2-24b-instruct-2506")

# Fallback transcription (voir clients/voxtral.py) : PAS un sous-traitant
# tiers mais une instance auto-hebergee de Voxtral-Mini-3B-2507 (open-weights,
# Apache 2.0), servie via vLLM (compatible OpenAI /v1/audio/transcriptions).
# Vide par defaut = chemin non exerce, non teste en conditions reelles (pas
# d'infra GPU provisionnee pour ce projet) : conception documentee plutot que
# fonctionnalite active. Voir le commentaire en tete de clients/voxtral.py.
SELF_HOSTED_VOXTRAL_URL = os.environ.get("SELF_HOSTED_VOXTRAL_URL", "")

VEXA_POLL_INTERVAL_SECONDS = 4

# OAuth calendrier (auto-join) - Google Calendar et Microsoft Graph. Les
# redirect URI DOIVENT pointer vers l'origine publique Next.js (proxyee par
# le rewrite /api/*), jamais vers le domaine propre d'ai-service : le cookie
# de session navi_session n'est jamais attache a une redirection directe
# vers l'origine ai-service (cf. next.config.js).
GOOGLE_CLIENT_ID = os.environ.get("GOOGLE_CLIENT_ID")
GOOGLE_CLIENT_SECRET = os.environ.get("GOOGLE_CLIENT_SECRET")
GOOGLE_REDIRECT_URI = os.environ.get(
    "GOOGLE_REDIRECT_URI", "http://localhost:3000/api/calendar/google/callback"
)

MICROSOFT_CLIENT_ID = os.environ.get("MICROSOFT_CLIENT_ID")
MICROSOFT_CLIENT_SECRET = os.environ.get("MICROSOFT_CLIENT_SECRET")
MICROSOFT_TENANT_ID = os.environ.get("MICROSOFT_TENANT_ID", "common")
MICROSOFT_REDIRECT_URI = os.environ.get(
    "MICROSOFT_REDIRECT_URI", "http://localhost:3000/api/calendar/microsoft/callback"
)

CALENDAR_SYNC_INTERVAL_MINUTES = int(os.environ.get("CALENDAR_SYNC_INTERVAL_MINUTES", "5"))
CALENDAR_LOOKAHEAD_MINUTES = int(os.environ.get("CALENDAR_LOOKAHEAD_MINUTES", "60"))
CALENDAR_JOIN_LEAD_SECONDS = int(os.environ.get("CALENDAR_JOIN_LEAD_SECONDS", "60"))
CALENDAR_JOIN_GRACE_SECONDS = int(os.environ.get("CALENDAR_JOIN_GRACE_SECONDS", "300"))

# Purge RGPD automatique (art. 5.1.e RGPD - limitation de la conservation) :
# anonymise les reunions dont retention_days est depasse. Intervalle large par
# defaut (peu de cout a verifier moins souvent que le calendrier).
RGPD_PURGE_INTERVAL_MINUTES = int(os.environ.get("RGPD_PURGE_INTERVAL_MINUTES", "60"))

# Duree de conservation des preuves de conformite (ConsentRecord,
# ParticipantNotification) UNE FOIS la reunion qu'elles couvrent deja
# anonymisee (cf. scheduler.purge_expired_consent_records) - volontairement
# decouplee et plus longue que retention_days du Meeting : la preuve doit
# pouvoir survivre a la suppression du contenu qu'elle atteste (accountability,
# art. 5.2 RGPD), au lieu d'etre conservee indefiniment par simple absence de
# politique.
#
# Valeur par defaut : 1825 jours (5 ans), alignee sur le delai de prescription
# civile de droit commun (art. 2224 Code civil) - c'est le delai de reference
# que la CNIL utilise elle-meme pour l'archivage intermediaire a des fins de
# preuve en cas de litige (cf. "Guide pratique : Les durees de conservation",
# cnil.fr). Ce n'est PAS une preconisation CNIL chiffree specifique a la preuve
# de consentement (aucune source fiable trouvee pour un chiffre dedie) : ce
# choix de 5 ans doit etre valide/ajuste explicitement par le porteur du
# projet selon son analyse de risque, pas traite comme une norme opposable.
CONSENT_RECORD_RETENTION_DAYS = int(os.environ.get("CONSENT_RECORD_RETENTION_DAYS", "1825"))
# Constante separee de CONSENT_RECORD_RETENTION_DAYS (meme valeur par defaut,
# meme justification ci-dessus) : ConsentRecord et ParticipantNotification
# couvrent la meme finalite (preuve de conformite RGPD / information des
# participants) donc pas de raison de diverger aujourd'hui, mais gardees
# ajustables independamment si une analyse juridique future distingue les
# deux cas.
PARTICIPANT_NOTIFICATION_RETENTION_DAYS = int(
    os.environ.get("PARTICIPANT_NOTIFICATION_RETENTION_DAYS", "1825")
)

# Auth + persistance : desormais entierement geres ici (ai-service), plus
# jamais cote Next.js. Nom dedie (pas "DATABASE_URL") pour eviter toute
# collision avec la valeur "file:./dev.db" (format Prisma, invalide pour
# SQLAlchemy) laissee dans .env.local par une experimentation TS anterieure.
JWT_SECRET = os.environ.get("JWT_SECRET")
AI_SERVICE_DATABASE_URL = os.environ.get("AI_SERVICE_DATABASE_URL", "sqlite:///./navi.db")
ENVIRONMENT = os.environ.get("ENVIRONMENT", "development")
IS_PRODUCTION = ENVIRONMENT == "production"

# Monitoring (Sentry) - optionnel, vide par defaut. Cf. main.py : quand
# renseignee, capture automatiquement toute exception non geree ET tout
# logger.error(...) existant (bascules mock/secours de clients/voxtral.py,
# mistral_cr.py, classifier.py, moderation.py, scaleway.py, scheduler.py)
# via l'integration logging de sentry-sdk - aucun changement necessaire sur
# ces call sites deja en place. Sans cle, aucun comportement different.
SENTRY_DSN = os.environ.get("SENTRY_DSN")

# Plafond d'usage mensuel (cf. rapport_technique.md §4 et §8) - couts unitaires
# reels des sous-traitants factures a l'usage (pas des prix factures au
# client, uniquement compares a MONTHLY_USAGE_CAP_USD ci-dessous pour estimer
# le cout d'un compte). Reprennent les couts verifies au §2 du rapport - ne
# pas les faire diverger sans mettre a jour le rapport en meme temps.
VOXTRAL_COST_PER_MINUTE_USD = float(os.environ.get("VOXTRAL_COST_PER_MINUTE_USD", "0.006"))
VEXA_COST_PER_HOUR_USD = float(os.environ.get("VEXA_COST_PER_HOUR_USD", "0.50"))

# Plafond de cout mensuel reel par compte, formule Pro (29,99 EUR/mois,
# "reunions illimitees") - protege contre le scenario worst case documente au
# rapport §8 (39h/semaine, cout reel ~$74/mois pour ~$32 factures) sans
# penaliser un usage professionnel normal, y compris "haute utilisation"
# (2h/jour ouvre, cout reel $18.42/mois - reste sous ce plafond).
#
# Valeur : ~65 % du prix Pro en $ (taux indicatif ~1.08, cf. rapport §8), au
# milieu de la fourchette 60-70 % recommandee par le rapport pour preserver
# une marge reelle meme a pleine utilisation. Plafond en cout cumule (donc en
# duree ponderee par mode : dictaphone et visio n'ont pas le meme cout/heure),
# pas en nombre de reunions - une minorite de reunions tres longues
# echapperait a un plafond par nombre. Voir crud.require_within_quota.
MONTHLY_USAGE_CAP_USD = float(os.environ.get("MONTHLY_USAGE_CAP_USD", "21.0"))
