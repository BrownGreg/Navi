import Link from "next/link";

function Question({ q, children }: { q: string; children: React.ReactNode }) {
  return (
    <div className="card" style={{ marginBottom: 10, padding: 14 }}>
      <div style={{ fontWeight: 500, marginBottom: 6 }}>{q}</div>
      <div className="secondary-text">{children}</div>
    </div>
  );
}

export default function FaqPage() {
  return (
    <div className="page">
      <div className="top-actions">
        <Link href="/">← Retour</Link>
      </div>

      <h1>FAQ</h1>
      <p className="secondary-text" style={{ marginBottom: 16 }}>
        Questions juridiques et techniques. Pour un guide pas-a-pas, voir <Link href="/aide">le guide
        d&apos;utilisation</Link>.
      </p>

      <h2 style={{ fontSize: 15, marginTop: 20, marginBottom: 10 }}>Questions juridiques (RGPD)</h2>

      <Question q="Sur quelle base legale Navi enregistre-t-il une reunion ?">
        En contexte professionnel, la base legale est generalement l&apos;interet legitime de
        l&apos;organisateur, pas un consentement actif obligatoire de chaque participant. Ceci dit,
        enregistrer une personne a son insu reste une infraction independante du RGPD (art. 226-1 du Code
        penal) : une information prealable reelle des participants est donc toujours necessaire, et Navi la
        materialise (nom explicite du bot en reunion, texte d&apos;invitation suggere, ecran de
        consentement participant).
      </Question>

      <Question q="Quelles donnees sont collectees ?">
        Votre email et mot de passe (hache, jamais stocke en clair) pour le compte ; l&apos;audio capte
        pendant une reunion (voix, potentiellement une donnee biometrique) ; la transcription qui en
        resulte, attribuee par intervenant.
      </Question>

      <Question q="Qui a acces a mes donnees ?">
        L&apos;organisateur de la reunion (titulaire du compte), et les sous-traitants techniques
        necessaires au traitement : Mistral AI (transcription, generation du compte-rendu, classification,
        moderation) et Vexa (bot de reunion visio). Voir la question suivante pour leur localisation.
      </Question>

      <Question q="Ou mes donnees sont-elles traitees ?">
        Les traitements IA (transcription, resume, classification, moderation) passent tous par Mistral AI,
        base dans l&apos;Union europeenne — un choix deliberement fait pour limiter les sous-traitants a un
        seul fournisseur UE. Le bot de reunion visio passe par Vexa, un service tiers independant ; reportez-
        vous a sa propre politique de confidentialite pour sa localisation exacte.
      </Question>

      <Question q="Combien de temps mes donnees sont-elles conservees ?">
        Le contenu d&apos;une reunion (transcription, compte-rendu) est conserve pour la duree choisie a la
        creation (30 jours par defaut, modifiable), puis anonymise automatiquement. Les preuves de
        consentement et de notification (pas le contenu de la reunion) sont conservees separement, 5 ans par
        defaut — une duree d&apos;accountability alignee sur la prescription civile de droit commun,
        distincte de la conservation du contenu lui-meme.
      </Question>

      <Question q="Comment supprimer mes donnees ?">
        Deposez une demande depuis <Link href="/rgpd">Exercer mes droits RGPD</Link> (acces, rectification
        ou suppression, plusieurs choix possibles a la fois). En tant qu&apos;organisateur, vous pouvez aussi
        supprimer immediatement le contenu d&apos;une de vos reunions depuis sa page de detail. Une demande
        est traitee sous 30 jours (art. 12 RGPD).
      </Question>

      <Question q="En tant que participant, suis-je informe qu'une reunion est enregistree ?">
        En visio, le bot rejoint sous le nom &laquo;&nbsp;Navi Notetaker — enregistrement&nbsp;&raquo;,
        visible dans la liste des participants, et l&apos;organisateur est invite a transmettre un texte
        d&apos;invitation explicite avant la reunion. Limite connue et assumee : l&apos;API du bot ne permet
        pas d&apos;envoyer automatiquement un message dans le chat de la reunion — l&apos;information repose
        donc sur ces deux signaux, pas encore sur une notification poussee automatiquement a chaque
        participant.
      </Question>

      <Question q="Puis-je refuser d'etre enregistre en tant que participant ?">
        Oui, depuis l&apos;ecran de notification participant, &laquo;&nbsp;Je ne consens pas&nbsp;&raquo;
        enregistre une vraie demande RGPD aupres de l&apos;organisateur, qui doit y repondre sous 30 jours.
        Ce n&apos;est pas un blocage technique automatique de l&apos;enregistrement en cours — le retrait
        passe par une demande formelle traitee par l&apos;organisateur, comme decrit ci-dessus.
      </Question>

      <h2 style={{ fontSize: 15, marginTop: 24, marginBottom: 10 }}>Questions techniques</h2>

      <Question q="Quels navigateurs sont supportes ?">
        Un navigateur recent (Chrome, Firefox, Edge, Safari) avec acces au microphone. L&apos;acces micro
        necessite une connexion en HTTPS (ou localhost en developpement) — c&apos;est une exigence du
        navigateur, pas de Navi.
      </Question>

      <Question q="Navi a-t-il acces a ma camera ?">
        Non, jamais, ni en mode visio ni en mode dictaphone : seul l&apos;audio est traite. La grille video
        du mode visio est un placeholder statique, choix assume.
      </Question>

      <Question q="Quelles plateformes de visioconference sont supportees ?">
        Google Meet, Microsoft Teams et Zoom, via un lien de reunion detecte automatiquement.
      </Question>

      <Question q="Que se passe-t-il si un fournisseur IA est indisponible ?">
        Navi ne plante jamais pour cette raison : chaque integration bascule automatiquement sur un mode
        simule si une cle API manque ou si un appel echoue, signale par un badge &laquo;&nbsp;mode
        demo&nbsp;&raquo; dans l&apos;interface.
      </Question>

      <Question q="Le compte-rendu genere est-il toujours exact ?">
        Non — il est genere par un modele de langage (Mistral) et peut contenir des approximations ou des
        erreurs, en particulier sur des enregistrements longs ou de mauvaise qualite audio. Relisez-le avant
        de le partager ou de vous appuyer dessus pour une decision importante.
      </Question>

      <Question q="Navi fonctionne-t-il hors connexion ?">
        Non, une connexion internet est necessaire de bout en bout (captation en direct, appels aux
        fournisseurs IA, sauvegarde en base).
      </Question>
    </div>
  );
}
