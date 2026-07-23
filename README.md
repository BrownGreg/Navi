# Navi — demo fonctionnelle

Demo du parcours Navi en React (Next.js, App Router) avec un backend Node.js integre (routes API Next.js). Le mode **dictaphone** est fonctionnel de bout en bout (enregistrement micro → transcription → diarisation → generation du compte-rendu). Le mode **visio** reste un mockup non fonctionnel (voir la contrainte projet : pas d'integration SDK visio en demo). Les ecrans participant (consentement, acces au CR sans compte, droits RGPD) sont inclus.

## Prerequis

- Node.js 18 ou plus recent (verifier avec `node -v`)
- npm (installe avec Node.js)
- Un navigateur avec acces au microphone pour tester le mode dictaphone (Chrome ou Firefox recommandes ; l'acces micro necessite `https://` ou `localhost`, ce qui est le cas par defaut en developpement)

## Installation

```bash
npm install
```

## Lancer la demo

```bash
npm run dev
```

Puis ouvrir [http://localhost:3000](http://localhost:3000).

Par defaut, la demo fonctionne entierement **en mode simule (mock)** : aucune cle API n'est necessaire. La transcription et le compte-rendu generes en mode mock sont des exemples fixes (annonces comme tels dans l'interface via le badge "mode demo") — ils ne refletent pas le contenu reel de votre enregistrement.

## Activer les vraies API (optionnel)

```bash
cp .env.example .env.local
```

Puis renseigner dans `.env.local` :

- `VOXTRAL_API_KEY` — cle API Voxtral (transcription + diarisation), a obtenir sur [app.voxtral.io](https://app.voxtral.io)
- `MISTRAL_API_KEY` — cle API Mistral (generation du compte-rendu), a obtenir sur [console.mistral.ai](https://console.mistral.ai)

Redemarrer `npm run dev` apres modification du `.env.local`. Si une cle est absente ou si l'appel a l'API echoue (quota, reseau, format de reponse different), la demo bascule automatiquement sur le mock correspondant plutot que de planter — un message est journalise cote serveur (`console.error`) pour le debug.

Les integrations Voxtral et Mistral sont ecrites au meilleur effort a partir de leur documentation publique. Verifier le contrat exact des endpoints (`lib/voxtral.ts`, `lib/mistral.ts`) au moment de l'usage, les API tierces evoluant regulierement.

## Parcours disponibles

| Ecran | URL de depart | Fonctionnel ? |
|---|---|---|
| Accueil / historique | `/` | Oui (donnees persistees en local) |
| Choix du mode | `/new` | Oui |
| Dictaphone — consentement → enregistrement → traitement → CR | `/new/dictaphone/consent` | Oui, de bout en bout |
| Visio — consentement → reunion en cours (mockup) | `/new/visio/consent` | Mockup, genere un CR d'exemple |
| Notification participant en reunion | `/participant/consent` | Mockup |
| Compte-rendu sans compte (lien partage) | `/cr/[shareId]` | Oui |
| Exercer mes droits RGPD | `/rgpd?meetingId=...` | Oui (demande enregistree en local) |

## Structure du projet

```
app/
  page.tsx                    accueil / historique
  new/                        choix du mode + parcours visio et dictaphone
  reunion/[id]/                vue CR organisateur
  cr/[shareId]/                vue CR participant sans compte
  participant/consent/         notification participant (mockup)
  rgpd/                        formulaire droits RGPD
  api/                         routes Node.js (transcribe, generate-cr, meetings, rgpd-request, mock-complete)
lib/
  store.ts                     persistance des reunions (fichier JSON local)
  mock.ts                      generateurs de transcription/CR simules
  voxtral.ts                    integration reelle Voxtral (avec fallback mock)
  mistral.ts                   integration reelle Mistral (avec fallback mock)
data/
  meetings.json                genere automatiquement au premier lancement (seed + reunions creees en demo)
```

## Limites connues (demo)

- Persistance simple par fichier JSON local — suffisant pour une demo, pas pour un usage multi-utilisateurs concurrent.
- Pas d'authentification : le parcours organisateur est ouvert (usage local uniquement).
- Le mode visio ne capte ni n'affiche de veritable flux video ou audio de visioconference — c'est un choix assume (voir contrainte projet), la grille video est un placeholder statique.
- Aucune camera n'est utilisee, ni en mode visio ni en mode dictaphone : seul l'audio est traite.
- L'export PDF est un bouton desactive (non implemente dans cette demo).
