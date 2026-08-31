# Navi — demo fonctionnelle

Demo du parcours Navi : frontend **Next.js** (App Router, React 19) + backend **FastAPI** (`ai-service/`, Python 3.12) qui centralise l'authentification, la persistance (SQLite/SQLAlchemy) et toutes les integrations IA. Next.js est un frontend pur : il ne parle a aucun fournisseur IA directement, il proxie `/api/*` vers `ai-service` (voir `next.config.js`).

Les deux modes de captation sont fonctionnels de bout en bout avec de vraies API :

- **Dictaphone** : enregistrement micro navigateur → transcription reelle (**Voxtral**, Mistral) → moderation reelle (**Mistral Moderation 2**) → generation du compte-rendu reelle (**Mistral**, Chat Completions).
- **Visio** : un bot **Vexa** rejoint une vraie reunion Google Meet, Microsoft Teams ou Zoom, recupere la transcription diarisee en direct, qui alimente ensuite le meme pipeline moderation → CR. Un **auto-join calendrier** (OAuth Google Calendar / Microsoft Graph) peut declencher ce join automatiquement a l'heure de la reunion, sans action manuelle.

**Le mock n'est pas un mode par defaut** : chaque integration bascule dessus uniquement en filet de securite (cle API absente, timeout, quota, reponse inattendue) — jamais comme chemin nominal. Sans cle API, tout fonctionne quand meme en mode simule de bout en bout (badge "mode demo" dans l'UI).

## Prerequis

- Node.js 20 ou plus recent
- npm (installe avec Node.js)
- Python 3.12 ou plus recent, pour le service `ai-service/`
- Un navigateur avec acces au microphone pour tester le mode dictaphone (acces micro necessite `https://` ou `localhost`)

## Installation

```bash
npm install

cd ai-service
python3 -m venv .venv
source .venv/bin/activate   # .venv\Scripts\activate sur Windows
pip install -r requirements.txt
cd ..
```

## Lancer la demo

Deux process a lancer en parallele (deux terminaux), depuis la racine du repo :

```bash
# Terminal 1 — service FastAPI (auth, persistance, orchestration IA)
npm run dev:ai

# Terminal 2 — Next.js
npm run dev
```

Puis ouvrir [http://localhost:3000](http://localhost:3000). Le service FastAPI ecoute sur [http://localhost:8000](http://localhost:8000) (`GET /health` pour verifier qu'il tourne et quels fournisseurs ont une cle configuree).

Un compte est necessaire pour le parcours organisateur (`/sign-up` puis `/sign-in`, auth JWT sur cookie httpOnly). Le CR reste consultable sans compte par un participant via le lien `/cr/[shareId]`.

## Activer les vraies API

```bash
cp .env.example .env.local
```

Ce fichier est partage par Next.js et par `ai-service` (charge via `python-dotenv`). Renseigner dans `.env.local` :

| Variable | Sert a | Ou l'obtenir |
|---|---|---|
| `AI_SERVICE_URL` | URL du service FastAPI appele par Next.js | `http://localhost:8000` par defaut |
| `JWT_SECRET` | Signature des cookies de session (`openssl rand -base64 32`) | A generer soi-meme |
| `AI_SERVICE_DATABASE_URL` | Base de donnees d'ai-service | `sqlite:///./navi.db` par defaut ; URL Postgres en production sans disque persistant |
| `MISTRAL_API_KEY` | Transcription (Voxtral, dictaphone), generation du CR, classification (Chat Completions) et moderation (Mistral Moderation 2) | [console.mistral.ai](https://console.mistral.ai) |
| `VEXA_API_KEY` / `VEXA_BASE_URL` | Bot de reunion visio (Vexa cloud) | [docs.vexa.ai](https://docs.vexa.ai) |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Auto-join calendrier Google Meet | [console.cloud.google.com](https://console.cloud.google.com) |
| `MICROSOFT_CLIENT_ID` / `MICROSOFT_CLIENT_SECRET` | Auto-join calendrier Teams | [portal.azure.com](https://portal.azure.com) |

Redemarrer les deux process apres modification du `.env.local`. Si une cle est absente ou si un appel echoue, `ai-service` journalise l'erreur (`logging`, niveau `ERROR`) et bascule automatiquement sur le mock correspondant plutot que de planter.

**Conformite** : la transcription, la generation du CR, la classification et desormais la moderation (Mistral Moderation 2, migree depuis gpt-oss-safeguard-20b/Groq) passent toutes par Mistral (UE) — un seul sous-traitant IA a evaluer. Voir `ai-service/clients/moderation.py` et `rapport_technique.md` (non versionne, cf. plus bas) pour l'historique de cette decision.

Les integrations sont ecrites au meilleur effort a partir de leur documentation publique (verifiee mi-2026, cf. commentaires dans le code). Voir `ai-service/clients/*.py`.

## Parcours disponibles

| Ecran | URL de depart | Fonctionnel ? |
|---|---|---|
| Connexion / inscription | `/sign-in`, `/sign-up` | Oui (JWT cookie httpOnly, bcrypt) |
| Accueil / historique | `/` | Oui (protege, une fois connecte) |
| Choix du mode | `/new` | Oui |
| Dictaphone — consentement → enregistrement → traitement → CR | `/new/dictaphone/consent` | Oui, de bout en bout (Voxtral + Mistral Moderation 2 + Mistral) |
| Visio — consentement → join Vexa → reunion en direct → traitement → CR | `/new/visio/consent` | Oui, de bout en bout (Vexa + Mistral Moderation 2 + Mistral) |
| Auto-join calendrier | `/settings/calendar` | Oui (OAuth Google / Microsoft, sync toutes les 5 min) |
| Notification participant en reunion | `/participant/consent` | Partiel — "Je ne consens pas" enregistre une vraie demande RGPD (POST /rgpd-request) ; aucun canal reel n'y mene encore un vrai participant (voir limites) |
| Compte-rendu sans compte (lien partage) | `/cr/[shareId]` | Oui |
| Export PDF du CR | Bouton sur `/reunion/[id]` | Oui (genere a la volee par `ai-service`, reportlab) |
| Exercer mes droits RGPD | `/rgpd?meetingId=...` | Oui (demande tracee en base ; effacement organisateur immediat via l'API, purge automatique a expiration de `retention_days`) |

## Structure du projet

```
app/                           Next.js (App Router) — frontend pur
  page.tsx                       accueil / historique
  sign-in/, sign-up/             auth
  new/                           choix du mode + parcours visio et dictaphone
  reunion/[id]/                  vue CR organisateur (export PDF, classification, moderation)
  cr/[shareId]/                  vue CR participant sans compte
  rgpd/                          formulaire d'exercice des droits RGPD
  settings/calendar/             connexion calendrier (auto-join)
  participant/consent/           notification participant (mockup)
lib/
  server-api.ts                  fetch cote Server Components, relaie le cookie de session vers ai-service
  api-client.ts                  fetch cote navigateur, redirige vers /sign-in sur 401
next.config.js                 rewrite declaratif /api/* -> AI_SERVICE_URL (aucune logique metier cote Node)

ai-service/                    FastAPI — backend complet (Python 3.12)
  main.py                        app FastAPI, enregistrement des routers, /health
  config.py                      lecture des env vars (partagees avec Next.js via .env.local)
  models.py, schemas.py, db.py   SQLAlchemy (Users, Meetings, CalendarConnection, RgpdRequest) + Pydantic
  security.py, deps.py           JWT cookie httpOnly, bcrypt, dependance get_current_user
  scheduler.py                   APScheduler : sync calendriers (5 min) + purge RGPD automatique (retention_days)
  routers/                       auth, meetings, transcribe, visio, moderate, generate_cr, classify, export, rgpd, calendar
  clients/                       un fournisseur par fichier (voxtral, mistral_cr, classifier, moderation, vexa, google_calendar, microsoft_calendar), fallback mock inclus
  services/                      logique partagee entre routers et scheduler (ex: visio_join.py)
  tests/                         suite pytest (voir plus bas)
```

## Tests et qualite

```bash
cd ai-service
source .venv/bin/activate
python -m pytest                         # suite complete
ruff check . --exclude .venv              # lint
ruff format --check . --exclude .venv     # formatage

cd ..
npx tsc --noEmit                          # verification des types frontend
npm run build                             # build de production
```

Un pipeline CI (`.github/workflows/ci.yml`) execute ces memes etapes (lint + tests Python, typecheck frontend, build Docker) a chaque push/PR. Le deploiement se fait via `render.yaml` (Render, voir plus haut).

## Limites connues (demo)

- Persistance SQLite locale — suffisant pour une demo, pas pour un usage multi-utilisateurs concurrent a grande echelle (pas de disque persistant sur certains PaaS gratuits : prevoir une URL Postgres externe en production, cf. `render.yaml`).
- Etat des reunions visio en cours (transcription en direct) garde en memoire cote `ai-service`, pas persiste : un redemarrage du service pendant une reunion perd la transcription accumulee jusqu'a ce moment (elle est persistee cote base des que "Terminer la reunion" est appele).
- `ai-service` tourne en un seul worker/process (`uvicorn` sans `--workers`) — suffisant pour une demo, pas dimensionne pour de la charge.
- Aucune camera n'est utilisee, ni en mode visio ni en mode dictaphone : seul l'audio est traite. La grille video du mode visio reste un placeholder statique (choix assume, Navi n'accede jamais a la camera).
- La moderation (Mistral Moderation 2) est non-bloquante par choix produit : un flag informatif est affiche sur la reunion, mais la generation du CR n'est jamais suspendue.
- **Notification reelle des participants (visio)** : l'API Vexa publique verifiee (cf. `ai-service/clients/vexa.py`) ne permet pas d'envoyer un message dans le chat de la reunion au moment ou le bot rejoint. Le bot est nomme explicitement "Navi Notetaker — enregistrement" dans la liste des participants (seul signal reellement visible), et un texte d'invitation suggere avec lien vers `/participant/consent` est propose a l'organisateur sur l'ecran de consentement visio — a coller manuellement, aucun envoi automatique d'e-mail n'est implemente. `/participant/consent` n'est donc atteint que si l'organisateur a effectivement transmis ce lien en amont ; ce n'est pas encore une notification poussee automatiquement a chaque participant.

## Documentation complementaire

`rapport_technique.md` (non versionne dans ce depot, cf. `.gitignore`) documente l'architecture detaillee, les integrations IA, la strategie RGPD et les choix techniques du projet certifiant associe.
