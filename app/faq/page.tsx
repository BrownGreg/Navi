import Link from "next/link";
import { isLoggedIn, LandingNav, LandingFooter } from "../landing-shell";

function Question({ q, children }: { q: string; children: React.ReactNode }) {
  return (
    <details className="landing-faq-item">
      <summary>{q}</summary>
      <div className="secondary-text">{children}</div>
    </details>
  );
}

export default async function FaqPage() {
  const loggedIn = await isLoggedIn();

  return (
    <div className="landing">
      <LandingNav loggedIn={loggedIn} />

      <section className="landing-hero" style={{ paddingBottom: 8 }}>
        <span className="landing-eyebrow">FAQ</span>
        <h1 style={{ fontSize: 36 }}>Questions juridiques et techniques</h1>
        <p className="lead">
          Pour un guide pas-à-pas, voir <Link href="/aide">le guide d&apos;utilisation</Link>.
        </p>
      </section>

      <section className="landing-section landing-section-narrow" style={{ paddingTop: 8 }}>
        <h2 className="landing-faq-group-title">Questions juridiques (RGPD)</h2>
        <div className="landing-faq-group">
          <Question q="Sur quelle base légale Navi enregistre-t-il une réunion ?">
            En contexte professionnel, la base légale est généralement l&apos;intérêt légitime de
            l&apos;organisateur, pas un consentement actif obligatoire de chaque participant. Ceci dit,
            enregistrer une personne à son insu reste une infraction indépendante du RGPD (art. 226-1 du
            Code pénal) : une information préalable réelle des participants est donc toujours nécessaire, et
            Navi la matérialise (nom explicite du bot en réunion, texte d&apos;invitation suggéré, écran de
            consentement participant).
          </Question>

          <Question q="Quelles données sont collectées ?">
            Votre email et mot de passe (haché, jamais stocké en clair) pour le compte ; l&apos;audio capté
            pendant une réunion (voix, potentiellement une donnée biométrique) ; la transcription qui en
            résulte, attribuée par intervenant.
          </Question>

          <Question q="Qui a accès à mes données ?">
            L&apos;organisateur de la réunion (titulaire du compte), et les sous-traitants techniques
            nécessaires au traitement : Mistral AI (transcription, génération du compte-rendu,
            classification, modération) et Vexa (bot de réunion visio). Voir la question suivante pour leur
            localisation.
          </Question>

          <Question q="Où mes données sont-elles traitées ?">
            Les traitements IA (transcription, résumé, classification, modération) passent tous par Mistral
            AI, basé dans l&apos;Union européenne — un choix délibérément fait pour limiter les
            sous-traitants à un seul fournisseur UE. Le bot de réunion visio passe par Vexa, un service tiers
            indépendant ; reportez-vous à sa propre politique de confidentialité pour sa localisation exacte.
          </Question>

          <Question q="Combien de temps mes données sont-elles conservées ?">
            Le contenu d&apos;une réunion (transcription, compte-rendu) est conservé pour la durée choisie à
            la création (30 jours par défaut, modifiable), puis anonymisé automatiquement. Les preuves de
            consentement et de notification (pas le contenu de la réunion) sont conservées séparément, 5 ans
            par défaut — une durée d&apos;accountability alignée sur la prescription civile de droit commun,
            distincte de la conservation du contenu lui-même.
          </Question>

          <Question q="Comment supprimer mes données ?">
            Déposez une demande depuis <Link href="/rgpd">Exercer mes droits RGPD</Link> (accès,
            rectification ou suppression, plusieurs choix possibles à la fois). En tant qu&apos;organisateur,
            vous pouvez aussi supprimer immédiatement le contenu d&apos;une de vos réunions depuis sa page de
            détail. Une demande est traitée sous 30 jours (art. 12 RGPD).
          </Question>

          <Question q="En tant que participant, suis-je informé qu'une réunion est enregistrée ?">
            En visio, le bot rejoint sous le nom &laquo;&nbsp;Navi Notetaker —
            enregistrement&nbsp;&raquo;, visible dans la liste des participants, et l&apos;organisateur est
            invité à transmettre un texte d&apos;invitation explicite avant la réunion. Limite connue et
            assumée : l&apos;API du bot ne permet pas d&apos;envoyer automatiquement un message dans le chat
            de la réunion — l&apos;information repose donc sur ces deux signaux, pas encore sur une
            notification poussée automatiquement à chaque participant.
          </Question>

          <Question q="Puis-je refuser d'être enregistré en tant que participant ?">
            Oui, depuis l&apos;écran de notification participant, &laquo;&nbsp;Je ne consens
            pas&nbsp;&raquo; enregistre une vraie demande RGPD auprès de l&apos;organisateur, qui doit y
            répondre sous 30 jours. Ce n&apos;est pas un blocage technique automatique de
            l&apos;enregistrement en cours — le retrait passe par une demande formelle traitée par
            l&apos;organisateur, comme décrit ci-dessus.
          </Question>
        </div>

        <h2 className="landing-faq-group-title" style={{ marginTop: 48 }}>Questions techniques</h2>
        <div className="landing-faq-group">
          <Question q="Quels navigateurs sont supportés ?">
            Un navigateur récent (Chrome, Firefox, Edge, Safari) avec accès au microphone. L&apos;accès micro
            nécessite une connexion en HTTPS (ou localhost en développement) — c&apos;est une exigence du
            navigateur, pas de Navi.
          </Question>

          <Question q="Navi a-t-il accès à ma caméra ?">
            Non, jamais, ni en mode visio ni en mode dictaphone : seul l&apos;audio est traité. La grille
            vidéo du mode visio est un placeholder statique, choix assumé.
          </Question>

          <Question q="Quelles plateformes de visioconférence sont supportées ?">
            Google Meet, Microsoft Teams et Zoom, via un lien de réunion détecté automatiquement.
          </Question>

          <Question q="Que se passe-t-il si un fournisseur IA est indisponible ?">
            Navi ne plante jamais pour cette raison : chaque intégration bascule automatiquement sur un mode
            simulé si une clé API manque ou si un appel échoue, signalé par un badge &laquo;&nbsp;mode
            démo&nbsp;&raquo; dans l&apos;interface.
          </Question>

          <Question q="Le compte-rendu généré est-il toujours exact ?">
            Non — il est généré par un modèle de langage (Mistral) et peut contenir des approximations ou des
            erreurs, en particulier sur des enregistrements longs ou de mauvaise qualité audio. Relisez-le
            avant de le partager ou de vous appuyer dessus pour une décision importante.
          </Question>

          <Question q="Navi fonctionne-t-il hors connexion ?">
            Non, une connexion internet est nécessaire de bout en bout (captation en direct, appels aux
            fournisseurs IA, sauvegarde en base).
          </Question>
        </div>
      </section>

      <LandingFooter />
    </div>
  );
}
