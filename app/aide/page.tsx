import Link from "next/link";

export default function AidePage() {
  return (
    <div className="page">
      <div className="top-actions">
        <Link href="/">← Retour</Link>
      </div>

      <h1>Guide d&apos;utilisation</h1>
      <p className="secondary-text" style={{ marginBottom: 16 }}>
        Comment utiliser Navi, etape par etape. Des questions juridiques ou techniques plus precises ?
        Consultez la <Link href="/faq">FAQ</Link>.
      </p>

      <h2 style={{ fontSize: 15, marginTop: 20, marginBottom: 6 }}>Creer un compte</h2>
      <p className="secondary-text">
        Un compte est necessaire pour enregistrer des reunions et retrouver votre historique. Inscrivez-vous
        depuis <Link href="/sign-up">l&apos;ecran de creation de compte</Link> avec un email et un mot de
        passe (8 caracteres minimum). Aucune verification d&apos;email n&apos;est requise pour commencer a
        utiliser Navi.
      </p>

      <h2 style={{ fontSize: 15, marginTop: 20, marginBottom: 6 }}>Mode dictaphone (reunion en presentiel)</h2>
      <p className="secondary-text">
        Depuis l&apos;accueil, choisissez &laquo;&nbsp;Nouvelle reunion&nbsp;&raquo; puis le mode dictaphone.
        Donnez un titre a la reunion, cochez les cases de consentement (elles sont obligatoires pour
        demarrer), puis lancez l&apos;enregistrement. Le microphone de votre appareil capte l&apos;audio ;
        a la fin, la transcription, la moderation et le compte-rendu sont generes automatiquement.
      </p>

      <h2 style={{ fontSize: 15, marginTop: 20, marginBottom: 6 }}>Mode visio (reunion a distance)</h2>
      <p className="secondary-text">
        Meme point de depart, mode visio. Collez le lien de la reunion (Google Meet, Microsoft Teams ou
        Zoom) : la plateforme est detectee automatiquement. Un bot nomme &laquo;&nbsp;Navi Notetaker —
        enregistrement&nbsp;&raquo; rejoint la reunion, visible dans la liste des participants, et
        transcrit en direct. Un texte d&apos;invitation suggere (avec un lien vers la page de consentement
        participant) est propose pour informer les participants avant la reunion.
      </p>

      <h2 style={{ fontSize: 15, marginTop: 20, marginBottom: 6 }}>Auto-join calendrier</h2>
      <p className="secondary-text">
        Depuis <Link href="/settings/calendar">Calendriers</Link>, connectez votre compte Google ou
        Microsoft. Navi verifie votre agenda toutes les 5 minutes et envoie automatiquement le bot aux
        reunions visio a venir, sans action de votre part.
      </p>

      <h2 style={{ fontSize: 15, marginTop: 20, marginBottom: 6 }}>Consulter et exporter un compte-rendu</h2>
      <p className="secondary-text">
        Vos reunions traitees apparaissent sur l&apos;accueil, avec filtres par mode/statut et une
        recherche par titre. Ouvrez une reunion pour voir la transcription, le resume, les decisions et
        les actions. Un bouton permet d&apos;exporter le compte-rendu en PDF. Un lien de partage
        (accessible sans compte) permet aussi de transmettre le compte-rendu a un participant.
      </p>

      <h2 style={{ fontSize: 15, marginTop: 20, marginBottom: 6 }}>Exercer vos droits RGPD</h2>
      <p className="secondary-text">
        Que vous soyez organisateur ou simple participant, vous pouvez demander l&apos;acces a vos
        donnees, leur rectification ou leur suppression depuis <Link href="/rgpd">Exercer mes droits
        RGPD</Link> — plusieurs types de demande peuvent etre coches en meme temps. En tant
        qu&apos;organisateur, retrouvez les demandes recues sur vos reunions depuis{" "}
        <Link href="/settings/rgpd">Demandes RGPD</Link>.
      </p>
    </div>
  );
}
