# Scribe (Navi) — demo fonctionnelle

Demo du parcours Scribe en React (Next.js, App Router) avec un backend Node.js integre (routes API Next.js) et un service d'orchestration IA en Python (**FastAPI**, `ai-service/`). Les deux modes de captation sont fonctionnels de bout en bout avec de vraies API :

- **Dictaphone** : enregistrement micro navigateur → transcription reelle (**Voxtral**, Mistral) → moderation reelle (**Mistral Moderation**) → generation du compte-rendu reelle (**Mistral Small 4**).
- **Visio** : un bot **Vexa** rejoint une vraie reunion Google Meet, Microsoft Teams ou Zoom, recupere la transcription diarisee en direct, qui alimente ensuite le meme pipeline moderation → CR.

Le Node.js n'appelle plus aucun fournisseur IA directement : il passe par le service FastAPI (`AI_SERVICE_URL`), qui centralise les integrations (Mistral pour la transcription/generation/moderation, Vexa pour le bot visio). **Le mock n'est plus un mode par defaut** : il ne sert que de filet de securite si une cle API est absente ou si un appel echoue (timeout, quota, format de reponse inattendu) — jamais comme chemin nominal. Les ecrans participant (consentement, acces au CR sans compte, droits RGPD) sont inclus.

## Prerequis

- Node.js 18 ou plus recent (verifier avec `node -v`)
- npm (installe avec Node.js)
- Python 3.11 ou plus recent (verifier avec `python3 --version`), pour le service `ai-service/`
- Un navigateur avec acces au microphone pour tester le mode dictaphone (Chrome ou Firefox recommandes ; l'acces micro necessite `https://` ou `localhost`, ce qui est le cas par defaut en developpement)

## Installation

```bash
cp .env.example .env
npm install

cd ai-service
python3 -m venv .venv
source .venv/bin/activate   # .venv\Scripts\activate sur Windows
pip install -r requirements.txt
cd ..
```

Sans cle renseignee dans `.env`, tout fonctionne quand meme en mode simule (mock) — voir "Activer les vraies API" plus bas pour brancher les vraies integrations.

### Alternative : Docker Compose

```bash
docker compose up
```

Construit et lance Next.js, `ai-service` et une base Postgres ensemble (voir `Dockerfile` et `docker-compose.yml`), sans installation locale de Node ou Python. Le fichier `.env` a la racine est charge par les deux services applicatifs.

## Lancer la demo

Deux process a lancer en parallele (deux terminaux), depuis la racine du repo :

```bash
# Terminal 1 — service FastAPI (orchestration IA)
npm run dev:ai

# Terminal 2 — Next.js
npm run dev
```

Puis ouvrir [http://localhost:3000](http://localhost:3000). Le service FastAPI ecoute sur [http://localhost:8000](http://localhost:8000) (`GET /health` pour verifier qu'il tourne).

Sans aucune cle API renseignee, tout fonctionne quand meme **en mode simule (mock)** de bout en bout, pour chacune des quatre integrations independamment — pratique pour tester le parcours sans credentials. Le contenu simule est annonce comme tel dans l'UI (badge "mode demo") et ne reflete pas le contenu reel capte.

## Activer les vraies API

```bash
cp .env.example .env
```

Ce fichier est partage par Next.js et par `ai-service` (charge via `python-dotenv`). Renseigner dans `.env` :

| Variable | Sert a | Ou l'obtenir |
|---|---|---|
| `DATABASE_URL` | Postgres, pour Prisma (fondation posee, branchement complet prevu au ticket P2-05 — non requis pour faire tourner la demo aujourd'hui) | URL de connexion Postgres |
| `JWT_SECRET` | Signature des sessions (`lib/auth.ts`) | `openssl rand -base64 32` — a generer, jamais commite |
| `AI_SERVICE_URL` | URL du service FastAPI appele par Next.js | `http://localhost:8000` par defaut |
| `MISTRAL_API_KEY` | Transcription (Voxtral) + generation du CR (Mistral Small 4) + moderation, cote `ai-service` | [console.mistral.ai](https://console.mistral.ai) |
| `VEXA_API_KEY` / `VEXA_BASE_URL` | Bot de reunion visio (Vexa cloud) | [docs.vexa.ai](https://docs.vexa.ai) |

Redemarrer les deux process (`npm run dev:ai` et `npm run dev`) apres modification du `.env`. Si une cle est absente ou si un appel echoue, le service FastAPI journalise l'erreur (`logging`) et bascule automatiquement sur le mock correspondant plutot que de planter — cote Node, un second filet de securite independant retombe lui aussi sur le mock local si `ai-service` est carrement injoignable.

**Note transitoire** : le code de `ai-service` (`config.py`, `clients/kimi.py`, `clients/safeguard.py`) lit encore `MOONSHOT_API_KEY` et `GROQ_API_KEY` pour la generation du CR (Kimi K3) et la moderation (gpt-oss-safeguard-20b via Groq) — ces deux variables ne sont plus dans `.env.example` car la cible est de tout faire passer par Mistral (Mistral Small 4 + Mistral Moderation), mais ce basculement cote `ai-service` n'est pas encore fait. Sans ces deux cles, la demo bascule automatiquement sur leur mock respectif (aucun risque de plantage), mais la generation de CR et la moderation reelles restent indisponibles tant que la migration `ai-service` n'est pas faite.

**Point de vigilance conformite** : Kimi K3 (Moonshot AI) n'est pas heberge en UE, ce qui contredit l'argumentaire "stack souveraine" ecrit initialement autour de Mistral (voir `Stack_Technique_Souveraine.md` et `Analyse_RGPD_Ethique_IA.md` section 5.5). Meme reserve pour gpt-oss-safeguard-20b tant qu'il est servi par Groq plutot que par une infra UE — le modele est a poids ouverts (Apache 2.0) et pourrait etre auto-heberge le jour ou une infra UE est disponible. Voir le commentaire dans `ai-service/clients/kimi.py` et `ai-service/clients/safeguard.py`.

Les quatre integrations sont ecrites au meilleur effort a partir de leur documentation publique (verifiee le 2026-07-22, cf. commentaires dans le code) : Vexa en particulier documente elle-meme un ecart entre son API cloud managee (version 0.10) et sa doc publique (version 0.12) — a reverifier au moment de l'usage. Voir `ai-service/clients/*.py`.

## Test end-to-end reel (visio + Vexa)

Guide pas-a-pas pour valider un vrai join Vexa sur une reunion de test courte (quelques minutes suffisent, pour surveiller le budget API) :

1. Creer un compte Vexa cloud et recuperer une cle API sur [docs.vexa.ai](https://docs.vexa.ai), la renseigner dans `VEXA_API_KEY`.
2. Renseigner egalement `MISTRAL_API_KEY`, `MOONSHOT_API_KEY` et `GROQ_API_KEY` dans `.env` (ces deux dernieres ne sont plus dans `.env.example`, voir la note transitoire ci-dessus, mais restent lues par `ai-service`).
3. Lancer `npm run dev:ai` puis `npm run dev`, verifier `GET http://localhost:8000/health` (tous les booleens `providers` doivent etre `true`).
4. Demarrer une vraie reunion Google Meet et noter son code (ex: `abc-defg-hij` dans l'URL `meet.google.com/abc-defg-hij`).
5. Dans l'app, aller sur `/new/visio/consent`, choisir "Google Meet", coller le code de reunion, valider le consentement, cliquer "Rejoindre la reunion".
6. Le bot Vexa devrait apparaitre dans la reunion Meet sous quelques secondes ; parler quelques phrases dans la reunion.
7. Sur `/new/visio/live`, la transcription en direct doit se remplir progressivement (poll toutes les ~3s), avec le badge "API reelle".
8. Cliquer "Terminer la reunion" : ca appelle `DELETE` du bot Vexa, lance la moderation (gpt-oss-safeguard-20b via Groq) puis la generation du CR (Kimi K3).
9. Verifier le CR sur `/reunion/[id]` : resume/decisions/actions/themes issus du vrai contenu de la reunion, et un eventuel badge de moderation si du contenu a ete signale.

Je (l'agent) ne peux pas rejoindre moi-meme une vraie reunion visio ni detenir de cles API reelles — cette validation reste une action manuelle a mener par l'equipe.

## Parcours disponibles

| Ecran | URL de depart | Fonctionnel ? |
|---|---|---|
| Accueil / historique | `/` | Oui (donnees persistees en local) |
| Choix du mode | `/new` | Oui |
| Dictaphone — consentement → enregistrement → traitement → CR | `/new/dictaphone/consent` | Oui, de bout en bout (Voxtral + gpt-oss-safeguard + Kimi K3) |
| Visio — consentement → join Vexa → reunion en direct → traitement → CR | `/new/visio/consent` | Oui, de bout en bout (Vexa + gpt-oss-safeguard + Kimi K3) |
| Notification participant en reunion | `/participant/consent` | Mockup |
| Compte-rendu sans compte (lien partage) | `/cr/[shareId]` | Oui |
| Exercer mes droits RGPD | `/rgpd?meetingId=...` | Oui (demande enregistree en local) |

## Structure du projet

Arborescence a la racine du repo :

```
app/               routes Next.js (App Router) : pages + routes API (app/api/*)
lib/                helpers partages : auth.ts (session JWT), password.ts (hash),
                    api-auth.ts (garde des routes API), store.ts (persistance JSON,
                    transitoire jusqu'a P2-05), proxies vers ai-service, mocks
middleware.ts       protection des pages/routes cote Edge (verification de session)
ai-service/         service FastAPI (Python) : orchestration Voxtral (STT), Mistral
                    Small 4 + moderation (cible ; Kimi K3/Groq encore en place, voir
                    plus haut), Vexa (bot visio)
prisma/             schema.prisma — pas encore branche (fondation posee via
                    DATABASE_URL, integration complete prevue au ticket P2-05)
fixtures/           donnees d'exemple utilisees par des ecrans mockup (ex. /participant/consent)
data/               data/meetings.json genere automatiquement au premier lancement
                    (persistance transitoire, voir lib/store.ts)
Dockerfile          image de l'app Next.js
docker-compose.yml  orchestration Next.js + ai-service + Postgres pour un lancement sans installation locale
.env.example        modele des variables d'environnement (a copier en .env)
README.md           ce fichier
```

Detail de `app/` :

```
app/
  page.tsx                    accueil / historique
  new/                        choix du mode + parcours visio et dictaphone (consent/record-or-live/processing)
  reunion/[id]/                vue CR organisateur (badge moderation si signale)
  cr/[shareId]/                vue CR participant sans compte
  participant/consent/         notification participant (mockup)
  rgpd/                        formulaire droits RGPD
  api/                         routes Node.js (transcribe, generate-cr, meetings, rgpd-request, visio/*, auth/signout)
                                 — proxient toutes vers ai-service/, ne parlent plus aux fournisseurs directement
```

Detail de `lib/` :

```
lib/
  auth.ts                      session JWT (cookie httpOnly) — voir commentaire en tete de fichier
  password.ts                  hash/verification des mots de passe
  api-auth.ts                  garde d'authentification pour les routes API
  store.ts                     persistance des reunions (fichier JSON local, transitoire — voir P2-05)
  mock.ts                      generateurs de transcription/CR simules (filet de securite local)
  voxtral.ts                   proxy vers ai-service (transcription dictaphone)
  kimi.ts                      proxy vers ai-service (generation du CR)
  moderation.ts                proxy vers ai-service (moderation gpt-oss-safeguard-20b)
  vexa.ts                      proxy vers ai-service (join/transcript/leave bot visio)
  gladia.ts, mistral.ts        deprecies — anciennes integrations directes, conservees pour historique
```

Detail de `ai-service/` :

```
ai-service/
  main.py                      app FastAPI (routes + healthcheck)
  config.py                    lecture des env vars (partagees avec Next.js via .env)
  clients/                     voxtral.py, kimi.py, safeguard.py (Groq), vexa.py — un fournisseur par fichier, fallback mock inclus
  routers/                     transcribe.py, visio.py, moderate.py, generate_cr.py
  mock.py                      filet de securite interne a FastAPI
```

## Limites connues (demo)

- Persistance simple par fichier JSON local (`data/meetings.json`) — suffisant pour une demo, pas pour un usage multi-utilisateurs concurrent.
- Authentification par session JWT en place (`lib/auth.ts`, `middleware.ts`) : toutes les pages sauf `/sign-in` et `/sign-up` exigent une session valide. Ces deux pages ne sont pas encore livrees a ce stade (en cours sur un autre ticket) — en attendant, la navigation vers les autres ecrans redirige vers une page de connexion pas encore disponible.
- Etat des reunions visio en cours (transcription en direct) garde en memoire cote `ai-service`, pas persiste : un redemarrage du service pendant une reunion perd la transcription accumulee jusqu'a ce moment (elle est en revanche persistee cote Next.js des que "Terminer la reunion" est appele).
- `ai-service` tourne en un seul worker/process (`uvicorn` sans `--workers`) — suffisant pour une demo, pas dimensionne pour de la charge.
- Aucune camera n'est utilisee, ni en mode visio ni en mode dictaphone : seul l'audio est traite. La grille video du mode visio reste un placeholder statique (choix assume, Scribe n'accede jamais a la camera).
- La moderation (gpt-oss-safeguard-20b) est non-bloquante par choix produit : un flag informatif est affiche sur la reunion, mais la generation du CR n'est jamais suspendue.
- L'export PDF est un bouton desactive (non implemente dans cette demo).
