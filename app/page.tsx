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
        <span className="landing-eyebrow">Conforme RGPD · IA hebergee en UE</span>
        <h1>Vos reunions, transcrites et resumees automatiquement</h1>
        <p className="lead">
          Navi capte la parole en reunion — au micro pour le presentiel, via un bot qui rejoint votre
          visio a distance — puis transcrit, modere et genere un compte-rendu structure avec decisions et
          actions. Meme pipeline derriere les deux modes, zero saisie manuelle.
        </p>
        <div className="landing-cta-row">
          <Link href="/sign-up" className="landing-btn landing-btn-primary">Creer un compte gratuitement</Link>
          <Link href="/sign-in" className="landing-btn">Se connecter</Link>
        </div>

        <div className="landing-hero-visual" aria-hidden="true">
          <div className="frame landing-preview">
            <div className="row" style={{ marginBottom: 4 }}>
              <span className="pill rec">● En cours — 12:34</span>
              <span className="pill accent">Visio · Google Meet</span>
            </div>
            <div className="landing-preview-waveform">
              {[14, 22, 12, 28, 18, 30, 16, 24, 12, 26, 15, 20].map((h, i) => (
                <span key={i} style={{ height: h }} />
              ))}
            </div>
            <div className="landing-preview-transcript">
              <p><strong>Sarah</strong> — On valide le budget Q3 a 40k€ pour la campagne.</p>
              <p><strong>Marc</strong> — Ok, je prepare le brief d&apos;ici vendredi.</p>
            </div>
            <div className="landing-preview-actions">
              <span className="pill">✓ Decision</span>
              <span className="secondary-text">Budget Q3 valide a 40k€</span>
            </div>
          </div>
        </div>
      </section>

      <section className="landing-section">
        <h2 className="landing-section-title">Deux facons de capter, un seul resultat</h2>
        <p className="landing-section-subtitle">
          C&apos;est la particularite de Navi : deux situations d&apos;usage opposees, la meme chaine de
          traitement derriere.
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
            <h3>Dictaphone — reunion en presentiel</h3>
            <p>
              Navi capte le micro de votre appareil pendant la reunion. Aucune camera, aucun logiciel a
              installer : vous demarrez, vous parlez, Navi transcrit.
            </p>
          </div>
          <div className="landing-feature-card">
            <div className="landing-icon-badge">
              <Icon>
                <rect x="2.5" y="6" width="13" height="12" rx="2.5" />
                <path d="M15.5 10.5 21 7v10l-5.5-3.5" />
              </Icon>
            </div>
            <h3>Visio — reunion a distance</h3>
            <p>
              Collez le lien Google Meet, Microsoft Teams ou Zoom : la plateforme est detectee
              automatiquement et un bot nomme &laquo;&nbsp;Navi Notetaker&nbsp;&raquo; rejoint la reunion
              pour capter l&apos;audio et transcrire en direct.
            </p>
          </div>
        </div>
      </section>

      <section className="landing-section" style={{ background: "var(--surface-1)" }}>
        <h2 className="landing-section-title">Comment ca marche</h2>
        <div className="landing-steps">
          <div>
            <div className="landing-step-num">1</div>
            <h3 style={{ fontSize: 14, margin: "0 0 6px", fontWeight: 500 }}>Consentement</h3>
            <p className="secondary-text" style={{ fontSize: 13 }}>
              Vous confirmez la finalite et la duree de conservation avant chaque enregistrement.
            </p>
          </div>
          <div>
            <div className="landing-step-num">2</div>
            <h3 style={{ fontSize: 14, margin: "0 0 6px", fontWeight: 500 }}>Captation</h3>
            <p className="secondary-text" style={{ fontSize: 13 }}>
              Micro ou bot de reunion selon le mode choisi, sans acces camera.
            </p>
          </div>
          <div>
            <div className="landing-step-num">3</div>
            <h3 style={{ fontSize: 14, margin: "0 0 6px", fontWeight: 500 }}>Transcription et moderation</h3>
            <p className="secondary-text" style={{ fontSize: 13 }}>
              Transcription automatique attribuee par intervenant, avec une verification de moderation.
            </p>
          </div>
          <div>
            <div className="landing-step-num">4</div>
            <h3 style={{ fontSize: 14, margin: "0 0 6px", fontWeight: 500 }}>Compte-rendu</h3>
            <p className="secondary-text" style={{ fontSize: 13 }}>
              Resume, decisions et actions structures, exportables en PDF ou partageables par lien.
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
        <h2 className="landing-section-title">Ne manquez plus une reunion</h2>
        <p className="landing-section-subtitle">
          Connectez Google Calendar ou Microsoft Outlook : Navi verifie votre agenda toutes les 5 minutes
          et envoie automatiquement le bot a l&apos;heure de la reunion, sans action de votre part.
        </p>
      </section>

      <section className="landing-section" style={{ background: "var(--surface-1)" }}>
        <h2 className="landing-section-title">Conforme RGPD, pas juste en apparence</h2>
        <div className="landing-grid">
          <div className="landing-feature-card">
            <div className="landing-icon-badge">
              <Icon>
                <path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z" />
                <path d="M9 12l2 2 4-4" />
              </Icon>
            </div>
            <h3>Consentement reellement verifie</h3>
            <p>Persiste en base et controle cote serveur avant tout traitement — pas juste une case cochee dans l&apos;interface.</p>
          </div>
          <div className="landing-feature-card">
            <div className="landing-icon-badge">
              <Icon>
                <path d="M4 7h16" />
                <path d="M9 7V4h6v3" />
                <path d="M6 7l1 13h10l1-13" />
                <path d="M10 11v6" />
                <path d="M14 11v6" />
              </Icon>
            </div>
            <h3>Droit a l&apos;effacement effectif</h3>
            <p>Organisateurs et participants peuvent demander l&apos;acces, la rectification ou la suppression de leurs donnees a tout moment.</p>
          </div>
          <div className="landing-feature-card">
            <div className="landing-icon-badge">
              <Icon>
                <circle cx="12" cy="12" r="9" />
                <path d="M12 7v5l3.5 2" />
              </Icon>
            </div>
            <h3>Conservation limitee et configurable</h3>
            <p>Duree choisie par reunion, purge automatique a expiration, un seul sous-traitant IA base dans l&apos;Union europeenne.</p>
          </div>
        </div>
        <p style={{ textAlign: "center", marginTop: 24 }}>
          <Link href="/faq" className="landing-btn">Voir la FAQ juridique complete</Link>
        </p>
      </section>

      <section className="landing-section landing-section-narrow">
        <h2 className="landing-section-title">Questions frequentes</h2>
        <div className="card" style={{ marginBottom: 10, padding: 14 }}>
          <div style={{ fontWeight: 500, marginBottom: 6 }}>Navi a-t-il acces a ma camera ?</div>
          <div className="secondary-text">Non, jamais, ni en visio ni en dictaphone : seul l&apos;audio est traite.</div>
        </div>
        <div className="card" style={{ marginBottom: 10, padding: 14 }}>
          <div style={{ fontWeight: 500, marginBottom: 6 }}>Que se passe-t-il si un fournisseur IA est indisponible ?</div>
          <div className="secondary-text">Navi ne plante jamais pour cette raison : bascule automatique en mode simule, signalee dans l&apos;interface.</div>
        </div>
        <div className="card" style={{ marginBottom: 10, padding: 14 }}>
          <div style={{ fontWeight: 500, marginBottom: 6 }}>Puis-je refuser d&apos;etre enregistre en tant que participant ?</div>
          <div className="secondary-text">Oui, une vraie demande RGPD est alors enregistree aupres de l&apos;organisateur.</div>
        </div>
        <p style={{ textAlign: "center", marginTop: 16 }}>
          <Link href="/faq">Voir toute la FAQ →</Link>
        </p>
      </section>

      <section className="landing-hero" style={{ paddingTop: 24 }}>
        <h1 style={{ fontSize: 28 }}>{loggedIn ? "Retrouvez vos reunions" : "Pret a essayer Navi ?"}</h1>
        <div className="landing-cta-row">
          {loggedIn ? (
            <Link href="/dashboard" className="landing-btn landing-btn-primary">Aller a mon espace</Link>
          ) : (
            <Link href="/sign-up" className="landing-btn landing-btn-primary">Creer un compte gratuitement</Link>
          )}
        </div>
      </section>

      <LandingFooter />
    </div>
  );
}
