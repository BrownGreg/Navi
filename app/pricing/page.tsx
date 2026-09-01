import Link from "next/link";
import { isLoggedIn, LandingNav, LandingFooter } from "../landing-shell";

export default async function PricingPage() {
  const loggedIn = await isLoggedIn();

  return (
    <div className="landing">
      <LandingNav loggedIn={loggedIn} />

      <section className="landing-hero" style={{ paddingBottom: 8 }}>
        <span className="landing-eyebrow">Tarifs</span>
        <h1 style={{ fontSize: 36 }}>Un tarif simple, sans surprise</h1>
        <p className="lead">
          Commencez gratuitement, passez à Pro quand vos réunions s&apos;enchaînent.
        </p>
      </section>

      <section className="landing-section landing-section-narrow" style={{ paddingTop: 8, maxWidth: 900 }}>
        <div className="landing-pricing-grid">
          <div className="landing-price-card">
            <div className="landing-price-name">Gratuit</div>
            <div className="landing-price-amount">0€<span>/mois</span></div>
            <p className="landing-price-desc">Pour découvrir Navi sur vos premières réunions.</p>
            <ul className="landing-price-features">
              <li>5 réunions par mois</li>
              <li>Mode dictaphone uniquement</li>
              <li>Compte-rendu généré automatiquement</li>
              <li>Conservation 30 jours</li>
            </ul>
            <Link href="/sign-up" className="landing-btn">Commencer gratuitement</Link>
          </div>

          <div className="landing-price-card featured">
            <span className="landing-price-badge">Populaire</span>
            <div className="landing-price-name">Pro</div>
            <div className="landing-price-amount">12€<span>/mois</span></div>
            <p className="landing-price-desc">Pour un usage régulier, seul ou en petite équipe.</p>
            <ul className="landing-price-features">
              <li>Réunions illimitées</li>
              <li>Dictaphone + visio (bot Meet, Teams, Zoom)</li>
              <li>Calendrier connecté, bot automatique</li>
              <li>Export PDF et partage par lien</li>
              <li>Conservation configurable</li>
            </ul>
            <Link href="/sign-up" className="landing-btn landing-btn-primary">Essayer Pro</Link>
          </div>

          <div className="landing-price-card">
            <div className="landing-price-name">Équipe</div>
            <div className="landing-price-amount">Sur devis</div>
            <p className="landing-price-desc">Pour plusieurs organisateurs et une gouvernance RGPD centralisée.</p>
            <ul className="landing-price-features">
              <li>Tout Pro, plusieurs utilisateurs</li>
              <li>Suivi centralisé des demandes RGPD</li>
              <li>Durée de conservation par défaut imposée</li>
              <li>Support prioritaire</li>
            </ul>
            <Link href="/sign-up" className="landing-btn">Nous contacter</Link>
          </div>
        </div>

        <p className="secondary-text" style={{ textAlign: "center", marginTop: 32 }}>
          Tarifs indicatifs présentés dans le cadre d&apos;un projet de certification RNCP — aucun paiement
          réel n&apos;est traité pour le moment.
        </p>
      </section>

      <LandingFooter />
    </div>
  );
}
