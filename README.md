# Navi

Navi: **Next.js** frontend (App Router, React 19) + **FastAPI** backend (`ai-service/`, Python 3.12) that centralizes authentication, persistence (SQLite/SQLAlchemy), and all AI integrations. Next.js is a pure frontend: it never talks to any AI provider directly, it proxies `/api/*` to `ai-service` (see `next.config.js`).

Both capture modes are functional end-to-end with real APIs:

- **Dictaphone**: browser mic recording → real transcription (**Voxtral**, Mistral) → real moderation (**Mistral Moderation 2**) → real meeting summary generation (**Mistral**, Chat Completions).
- **Visio**: a **Vexa** bot joins a real Google Meet, Microsoft Teams, or Zoom meeting, retrieves the live diarized transcript, which then feeds the same moderation → summary pipeline. A **calendar auto-join** (Google Calendar / Microsoft Graph OAuth) can trigger this join automatically at meeting time, with no manual action.

**Mock is not a default mode**: each integration falls back to it only as a safety net (missing API key, timeout, quota, unexpected response) — never as the nominal path. Without an API key, everything still works end-to-end in simulated mode (a "demo mode" badge in the UI).

Once a summary exists, the dashboard (`/dashboard`) is a real overview rather than a redirect to the latest meeting: a card grid grouped by project/client, a to-do view aggregating action items across every meeting (or a single project), rename/delete on each meeting, and manual project creation/assignment/deletion. Action items support a P0–P5 priority and a real done/not-done state (`PATCH /meetings/{id}/actions/{index}`). Switching the interface to English also translates the generated summary/decisions/actions/themes on the fly (Mistral, same fallback chain as generation), translated once per meeting and cached (`Meeting.cr_translations`) — never re-translated, and the French original in storage is never overwritten.

## Prerequisites

- Node.js 20 or newer
- npm (installed with Node.js)
- Python 3.12 or newer, for the `ai-service/` service
- A browser with microphone access to test dictaphone mode (mic access requires `https://` or `localhost`)

## Installation

```bash
npm install

cd ai-service
python3 -m venv .venv
source .venv/bin/activate   # .venv\Scripts\activate on Windows
pip install -r requirements.txt
cd ..
```

## Running the application

Two processes to run in parallel (two terminals), from the repo root:

```bash
# Terminal 1 — FastAPI service (auth, persistence, AI orchestration)
npm run dev:ai

# Terminal 2 — Next.js
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000). The FastAPI service listens on [http://localhost:8000](http://localhost:8000) (`GET /health` to check it's running and which providers have a key configured).

An account is required for the organizer journey (`/sign-up` then `/sign-in`, JWT auth on an httpOnly cookie). The meeting summary remains viewable without an account by a participant via the `/cr/[shareId]` link.

## Enabling real APIs

```bash
cp .env.example .env.local
```

This file is shared by Next.js and `ai-service` (loaded via `python-dotenv`). Fill in `.env.local`:

| Variable | Used for | Where to get it |
|---|---|---|
| `AI_SERVICE_URL` | URL of the FastAPI service called by Next.js | `http://localhost:8000` by default |
| `JWT_SECRET` | Signing session cookies (`openssl rand -base64 32`) | Generate it yourself |
| `AI_SERVICE_DATABASE_URL` | ai-service database | `sqlite:///./navi.db` by default; Postgres URL in production without a persistent disk |
| `MISTRAL_API_KEY` | Transcription (Voxtral, dictaphone), summary generation, classification (Chat Completions), and moderation (Mistral Moderation 2) | [console.mistral.ai](https://console.mistral.ai) |
| `VEXA_API_KEY` / `VEXA_BASE_URL` | Visio meeting bot (Vexa cloud) | [docs.vexa.ai](https://docs.vexa.ai) |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Google Meet calendar auto-join | [console.cloud.google.com](https://console.cloud.google.com) |
| `MICROSOFT_CLIENT_ID` / `MICROSOFT_CLIENT_SECRET` | Teams calendar auto-join | [portal.azure.com](https://portal.azure.com) |

Restart both processes after modifying `.env.local`. If a key is missing or a call fails, `ai-service` logs the error (`logging`, `ERROR` level) and automatically falls back to the corresponding mock instead of crashing.

**Compliance**: transcription, summary generation, classification, and now moderation (Mistral Moderation 2, migrated from gpt-oss-safeguard-20b/Groq) all go through Mistral (EU) — a single AI sub-processor to assess. See `ai-service/clients/moderation.py` and `rapport_technique.tex` (not version-controlled, see below) for the history of this decision.

Integrations are written on a best-effort basis from their public documentation (checked mid-2026, see comments in the code). See `ai-service/clients/*.py`.

## Available journeys

| Screen | Starting URL | Functional? |
|---|---|---|
| Public landing page | `/` | Yes (marketing, unauthenticated — CTA to `/sign-up` / `/sign-in`) |
| Sign in / sign up | `/sign-in`, `/sign-up` | Yes (httpOnly JWT cookie, bcrypt) |
| Dashboard (meeting overview) | `/dashboard` | Yes — card grid grouped by project/client, to-do view across meetings, rename/delete, project create/assign/delete |
| Mode selection | `/new` | Yes |
| Dictaphone — consent → recording → processing → summary | `/new/dictaphone/consent` | Yes, end-to-end (Voxtral + Mistral Moderation 2 + Mistral) |
| Visio — consent → join Vexa → live meeting → processing → summary | `/new/visio/consent` | Yes, end-to-end (Vexa + Mistral Moderation 2 + Mistral) |
| Calendar auto-join | `/settings/calendar` | Yes (Google / Microsoft OAuth, syncs every 5 min) |
| Participant notification during a meeting | `/participant/consent` | Partial — "I do not consent" records a real GDPR request (POST /rgpd-request); no real channel yet delivers this to an actual participant (see limitations) |
| Summary without an account (shared link) | `/cr/[shareId]` | Yes |
| PDF export of the summary | Button on `/reunion/[id]` | Yes (generated on the fly by `ai-service`, reportlab) |
| Exercising GDPR rights | `/rgpd?meetingId=...` | Yes (several request types can be checked at once — e.g. access then erasure; immediate organizer erasure via the API, automatic purge on `retention_days` expiry) |
| Received GDPR requests (organizer view) | `/settings/rgpd` | Yes (filtered to meetings owned by the signed-in user) |

**Retention of compliance evidence**: `ConsentRecord` and `ParticipantNotification` are never purged alongside the meeting content (`retention_days`) — they survive its anonymization, with their own retention period (`CONSENT_RECORD_RETENTION_DAYS` / `PARTICIPANT_NOTIFICATION_RETENTION_DAYS`, 5 years by default, aligned with the standard civil statute of limitations), and are only deleted once the corresponding meeting has already been anonymized.

## Project structure

```
app/                           Next.js (App Router) — pure frontend
  page.tsx                       home / history
  sign-in/, sign-up/             auth
  new/                           mode selection + visio and dictaphone journeys
  reunion/[id]/                  organizer summary view (PDF export, classification, moderation)
  cr/[shareId]/                  participant summary view without an account
  rgpd/                          GDPR rights request form (multiple types selectable)
  settings/calendar/             calendar connection (auto-join)
  settings/rgpd/                 received GDPR requests, filtered by organizer
  participant/consent/           participant notification + real GDPR request on decline
lib/
  server-api.ts                  fetch for Server Components, forwards the session cookie to ai-service
  api-client.ts                  browser-side fetch, redirects to /sign-in on 401
next.config.js                 declarative rewrite /api/* -> AI_SERVICE_URL (no business logic on the Node side)

ai-service/                    FastAPI — full backend (Python 3.12)
  main.py                        FastAPI app, router registration, /health
  config.py                      reads env vars (shared with Next.js via .env.local)
  models.py, schemas.py, db.py   SQLAlchemy (Users, Meetings, Projects, CalendarConnection, ConsentRecord, ParticipantNotification, RgpdRequest) + Pydantic
  security.py, deps.py           httpOnly JWT cookie, bcrypt, get_current_user dependency
  scheduler.py                   APScheduler: calendar sync (5 min) + automatic GDPR purge (retention_days, then consent/notification evidence separately)
  routers/                       auth, meetings, projects, transcribe, visio, moderate, generate_cr, classify, export, rgpd, calendar
  clients/                       one provider per file (voxtral, mistral_cr, classifier, moderation, translator, vexa, google_calendar, microsoft_calendar), mock fallback included
  services/                      logic shared between routers and the scheduler (e.g. visio_join.py)
  tests/                         pytest suite (see below)
```

## Tests and quality

```bash
cd ai-service
source .venv/bin/activate
python -m pytest                         # full suite
ruff check . --exclude .venv              # lint
ruff format --check . --exclude .venv     # formatting

cd ..
npx tsc --noEmit                          # frontend type checking
npm run build                             # production build
```

A CI pipeline (`.github/workflows/ci.yml`) runs these same steps (Python lint + tests, frontend typecheck, Docker build) on every push/PR. Deployment happens via `render.yaml` (Render, see above).

## Known limitations

- Local SQLite persistence — sufficient for small-scale usage, not for large-scale concurrent multi-user usage (no persistent disk on some free PaaS tiers: plan for an external Postgres URL in production, see `render.yaml`).
- The state of in-progress visio meetings (live transcript) is kept in memory on the `ai-service` side, not persisted: a service restart during a meeting loses the transcript accumulated up to that point (it is persisted to the database as soon as "End meeting" is called).
- `ai-service` runs as a single worker/process (`uvicorn` without `--workers`) — not sized for load as it stands.
- No camera is used, neither in visio nor dictaphone mode: only audio is processed. The visio mode's video grid remains a static placeholder (a deliberate choice — Navi never accesses the camera).
- Moderation (Mistral Moderation 2) is non-blocking by product choice: an informational flag is shown on the meeting, but summary generation is never suspended.
- **Real participant notification (visio)**: the verified public Vexa API (see `ai-service/clients/vexa.py`) does not support sending a chat message when the bot joins the meeting. The bot is given an explicit name, "Navi Notetaker — recording," in the participant list (the only genuinely visible signal), and a suggested invitation text with a link to `/participant/consent` is offered to the organizer on the visio consent screen — to be pasted in manually, no automatic email is sent. `/participant/consent` is therefore only reached if the organizer has actually shared this link beforehand; it is not yet a notification automatically pushed to every participant.

## Additional documentation

`rapport_technique.tex` (not version-controlled in this repo, see `.gitignore`) documents the detailed architecture, AI integrations, GDPR strategy, and technical choices of the associated certification project.
