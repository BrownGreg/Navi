import Link from "next/link";
import { isLoggedIn, LandingNav, LandingFooter } from "./landing-shell";

function Icon({ children }: { children: React.ReactNode }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      {children}
    </svg>
  );
}

export default async function LandingPage() {
  const loggedIn = await isLoggedIn();

  return (
    <div className="landing">
      <LandingNav loggedIn={loggedIn} />

      <section className="landing-hero">
        <span className="landing-eyebrow">Conforme RGPD · IA hébergée en UE</span>
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

        <div className="landing-hero-visual" aria-hidden="true">
          <div className="landing-browser">
            <div className="landing-browser-bar">
              <div className="landing-browser-dots"><span /><span /><span /></div>
              <span className="landing-browser-url">navi.app</span>
            </div>
            <div style={{ padding: "28px 32px", display: "flex", flexDirection: "column", gap: 16 }}>
              <div className="row" style={{ alignItems: "flex-start" }}>
                <div>
                  <div style={{ fontFamily: "var(--font-heading)", fontSize: 19 }}>Point produit — sprint 14</div>
                  <div className="secondary-text" style={{ marginTop: 4 }}>2 septembre · 32 min · Google Meet</div>
                </div>
                <span className="tag tag-accent">Resume</span>
              </div>
              <div className="landing-preview-transcript" style={{ borderTop: "1px solid var(--border)", paddingTop: 14 }}>
                <p><strong>Camille</strong> — On garde le perimetre, le consentement passe devant l&apos;export CSV.</p>
                <p><strong>Yanis</strong> — D&apos;accord, je chiffre l&apos;export cette semaine.</p>
              </div>
              <div style={{ borderRadius: "var(--radius-md)", background: "var(--color-neutral-900)", padding: "12px 14px", display: "flex", gap: 12 }}>
                <span style={{ width: 2, borderRadius: 2, background: "var(--accent)" }} />
                <span style={{ fontSize: 13, lineHeight: 1.6, color: "var(--color-neutral-200)" }}>Le consentement passe en deux etapes, avant l&apos;export CSV reporte au sprint 15.</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section style={{ background: "var(--color-section)", backgroundImage: "radial-gradient(70% 140% at 15% 0%, var(--color-section-glow), transparent 70%)" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "40px 24px", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 24 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span style={{ fontFamily: "var(--font-heading)", fontSize: 28, fontWeight: 500 }}>Automatique</span>
            <span style={{ fontSize: 12, color: "var(--color-neutral-300)" }}>compte-rendu genere des la fin de la reunion</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span style={{ fontFamily: "var(--font-heading)", fontSize: 28, fontWeight: 500 }}>100 %</span>
            <span style={{ fontSize: 12, color: "var(--color-neutral-300)" }}>du traitement IA en Europe</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span style={{ fontFamily: "var(--font-heading)", fontSize: 28, fontWeight: 500 }}>30 j</span>
            <span style={{ fontSize: 12, color: "var(--color-neutral-300)" }}>de conservation par defaut, puis purge</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span style={{ fontFamily: "var(--font-heading)", fontSize: 28, fontWeight: 500 }}>0</span>
            <span style={{ fontSize: 12, color: "var(--color-neutral-300)" }}>acces a la camera, jamais</span>
          </div>
        </div>
      </section>

      <section className="landing-section">
        <h2 className="landing-section-title">Deux façons de capter, un seul résultat</h2>
        <p className="landing-section-subtitle">
          C&apos;est la particularité de Navi : deux situations d&apos;usage opposées, la même chaîne de
          traitement derrière.
        </p>
        <div className="landing-split">
          <div className="landing-feature-card">
            <div className="landing-icon-badge">
              <Icon>
                <rect x="9" y="3" width="6" height="10" rx="3" />
                <path d="M5 11a7 7 0 0 0 14 0" />
                <path d="M12 18v3" />
                <path d="M9 21h6" />
              </Icon>
            </div>
            <h3>Dictaphone — réunion en présentiel</h3>
            <p>
              Navi capte le micro de votre appareil pendant la réunion. Aucune caméra, aucun logiciel à
              installer : vous démarrez, vous parlez, Navi transcrit.
            </p>
          </div>
          <div className="landing-feature-card">
            <div className="landing-icon-badge">
              <Icon>
                <rect x="2.5" y="6" width="13" height="12" rx="2.5" />
                <path d="M15.5 10.5 21 7v10l-5.5-3.5" />
              </Icon>
            </div>
            <h3>Visio — réunion à distance</h3>
            <p>
              Collez le lien Google Meet, Microsoft Teams ou Zoom : la plateforme est détectée
              automatiquement et un bot nommé &laquo;&nbsp;Navi Notetaker&nbsp;&raquo; rejoint la réunion
              pour capter l&apos;audio et transcrire en direct.
            </p>
          </div>
        </div>
      </section>

      <section className="landing-section" style={{ background: "var(--surface-1)" }}>
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
        <div className="landing-icon-badge centered">
          <Icon>
            <rect x="3" y="5" width="18" height="16" rx="2" />
            <path d="M3 10h18" />
            <path d="M8 3v4" />
            <path d="M16 3v4" />
          </Icon>
        </div>
        <h2 className="landing-section-title">Ne manquez plus une réunion</h2>
        <p className="landing-section-subtitle">
          Connectez Google Calendar ou Microsoft Outlook : Navi vérifie votre agenda toutes les 5 minutes
          et envoie automatiquement le bot à l&apos;heure de la réunion, sans action de votre part.
        </p>
      </section>

      <section className="landing-section" style={{ background: "var(--surface-1)" }}>
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
