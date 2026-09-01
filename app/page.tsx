import { Fraunces, IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google";
import Link from "next/link";
import { isLoggedIn, LandingNav, LandingFooter } from "./landing-shell";

const serif = Fraunces({
  subsets: ["latin"],
  weight: ["500", "600"],
  style: ["normal", "italic"],
  variable: "--font-serif",
  display: "swap",
});
const sans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "600"],
  variable: "--font-sans",
  display: "swap",
});
const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
  display: "swap",
});

export default async function LandingPage() {
  const loggedIn = await isLoggedIn();

  return (
    <div className={`landing nv-doc ${serif.variable} ${sans.variable} ${mono.variable}`}>
      <LandingNav loggedIn={loggedIn} />

      <section className="landing-hero">
        <span className="nv-doc-kicker">Conforme RGPD. IA hébergée en Europe.</span>
        <h1>Vos réunions, transcrites et résumées automatiquement</h1>
        <p className="lead">
          Navi capte la parole en réunion — au micro pour le présentiel, via un bot qui rejoint votre
          visio à distance — puis transcrit, modère et génère un compte-rendu structuré avec décisions et
          actions. Même pipeline derrière les deux modes, zéro saisie manuelle.
        </p>
        <div className="landing-cta-row">
          <Link href="/sign-up" className="landing-btn landing-btn-primary">Créer un compte gratuitement</Link>
          <Link href="/sign-in" className="landing-btn">Se connecter</Link>
        </div>

        <div className="nv-doc-sheet" aria-hidden="true">
          <div className="nv-doc-sheet-head">
            <span className="nv-doc-sheet-title">Réunion budget Q3</span>
            <span className="nv-doc-sheet-time">12:34</span>
          </div>
          <div className="nv-doc-transcript">
            <p><strong>Sarah</strong> <span>— On valide le budget Q3 à 40k€ pour la campagne.</span></p>
            <p><strong>Marc</strong> <span>— Ok, je prépare le brief d&apos;ici vendredi.</span></p>
          </div>
          <span className="nv-doc-stamp">✓ Décision actée</span>
        </div>
      </section>

      <section className="landing-section">
        <h2 className="landing-section-title">Deux façons de capter, un seul résultat</h2>
        <p className="landing-section-subtitle">
          C&apos;est la particularité de Navi : deux situations d&apos;usage opposées, la même chaîne de
          traitement derrière.
        </p>
        <div className="nv-doc-modes">
          <div className="nv-doc-mode-manual">
            <div className="nv-doc-mode-mark" />
            <h3>Dictaphone, réunion en présentiel</h3>
            <p>
              Navi capte le micro de votre appareil pendant la réunion. Aucune caméra, aucun logiciel à
              installer : vous démarrez, vous parlez, Navi transcrit.
            </p>
          </div>
          <div className="nv-doc-mode-remote">
            <span className="nv-doc-mode-remote-meta">meet.google.com/xxx-yyyy-zzz</span>
            <div>
              <h3>Visio, réunion à distance</h3>
              <p>
                Collez le lien Google Meet, Microsoft Teams ou Zoom : la plateforme est détectée
                automatiquement et un bot nommé &laquo;&nbsp;Navi Notetaker&nbsp;&raquo; rejoint la réunion
                pour capter l&apos;audio et transcrire en direct.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="landing-section nv-doc-band">
        <h2 className="landing-section-title">Comment ça marche</h2>
        <div className="landing-steps">
          <div className="landing-step-card">
            <div className="landing-step-num">1</div>
            <h3 style={{ fontSize: 14, margin: "0 0 6px", fontWeight: 500 }}>Consentement</h3>
            <p className="secondary-text" style={{ fontSize: 13 }}>
              Vous confirmez la finalité et la durée de conservation avant chaque enregistrement.
            </p>
          </div>
          <div className="landing-step-card">
            <div className="landing-step-num">2</div>
            <h3 style={{ fontSize: 14, margin: "0 0 6px", fontWeight: 500 }}>Captation</h3>
            <p className="secondary-text" style={{ fontSize: 13 }}>
              Micro ou bot de réunion selon le mode choisi, sans accès caméra.
            </p>
          </div>
          <div className="landing-step-card">
            <div className="landing-step-num">3</div>
            <h3 style={{ fontSize: 14, margin: "0 0 6px", fontWeight: 500 }}>Transcription et modération</h3>
            <p className="secondary-text" style={{ fontSize: 13 }}>
              Transcription automatique attribuée par intervenant, avec une vérification de modération.
            </p>
          </div>
          <div className="landing-step-card">
            <div className="landing-step-num">4</div>
            <h3 style={{ fontSize: 14, margin: "0 0 6px", fontWeight: 500 }}>Compte-rendu</h3>
            <p className="secondary-text" style={{ fontSize: 13 }}>
              Résumé, décisions et actions structurées, exportables en PDF ou partageables par lien.
            </p>
          </div>
        </div>
      </section>

      <section className="landing-section">
        <h2 className="landing-section-title">Ne manquez plus une réunion</h2>
        <p className="landing-section-subtitle">
          Connectez Google Calendar ou Microsoft Outlook : Navi vérifie votre agenda toutes les 5 minutes
          et envoie automatiquement le bot à l&apos;heure de la réunion, sans action de votre part.
        </p>
      </section>

      <section className="landing-section nv-doc-trust-section">
        <h2 className="landing-section-title">Conforme RGPD, pas juste en apparence</h2>
        <div className="landing-trust">
          <div>
            <p className="landing-trust-statement">
              <strong>1 seul sous-traitant IA</strong>, basé dans l&apos;Union européenne.
            </p>
            <p className="landing-trust-sub">
              Un choix délibéré pour limiter la surface de traitement de vos données : pas de cascade de
              fournisseurs tiers, un pipeline unique, auditable de bout en bout.
            </p>
          </div>
          <ul className="landing-trust-list">
            <li>
              <div>
                <strong>Consentement réellement vérifié</strong>
                <p>Persisté en base et contrôlé côté serveur avant tout traitement — pas juste une case cochée dans l&apos;interface.</p>
              </div>
            </li>
            <li>
              <div>
                <strong>Droit à l&apos;effacement effectif</strong>
                <p>Organisateurs et participants peuvent demander l&apos;accès, la rectification ou la suppression de leurs données à tout moment.</p>
              </div>
            </li>
            <li>
              <div>
                <strong>Conservation limitée et configurable</strong>
                <p>Durée choisie par réunion, purge automatique à expiration.</p>
              </div>
            </li>
          </ul>
        </div>
        <p style={{ textAlign: "center", marginTop: 32 }}>
          <Link href="/faq" className="landing-btn">Voir la FAQ juridique complète</Link>
        </p>
      </section>

      <section className="landing-section landing-section-narrow">
        <h2 className="landing-section-title">Questions fréquentes</h2>
        <div className="card" style={{ marginBottom: 10, padding: 14 }}>
          <div style={{ fontWeight: 500, marginBottom: 6 }}>Navi a-t-il accès à ma caméra ?</div>
          <div className="secondary-text">Non, jamais, ni en visio ni en dictaphone : seul l&apos;audio est traité.</div>
        </div>
        <div className="card" style={{ marginBottom: 10, padding: 14 }}>
          <div style={{ fontWeight: 500, marginBottom: 6 }}>Que se passe-t-il si un fournisseur IA est indisponible ?</div>
          <div className="secondary-text">Navi ne plante jamais pour cette raison : bascule automatique en mode simulé, signalée dans l&apos;interface.</div>
        </div>
        <div className="card" style={{ marginBottom: 10, padding: 14 }}>
          <div style={{ fontWeight: 500, marginBottom: 6 }}>Puis-je refuser d&apos;être enregistré en tant que participant ?</div>
          <div className="secondary-text">Oui, une vraie demande RGPD est alors enregistrée auprès de l&apos;organisateur.</div>
        </div>
        <p style={{ textAlign: "center", marginTop: 16 }}>
          <Link href="/faq">Voir toute la FAQ →</Link>
        </p>
      </section>

      <section className="landing-hero" style={{ paddingTop: 24 }}>
        <h1 style={{ fontSize: 28 }}>{loggedIn ? "Retrouvez vos réunions" : "Prêt à essayer Navi ?"}</h1>
        <div className="landing-cta-row">
          {loggedIn ? (
            <Link href="/dashboard" className="landing-btn landing-btn-primary">Aller à mon espace</Link>
          ) : (
            <Link href="/sign-up" className="landing-btn landing-btn-primary">Créer un compte gratuitement</Link>
          )}
        </div>
      </section>

      <LandingFooter />
    </div>
  );
}
