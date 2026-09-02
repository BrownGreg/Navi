import Link from "next/link";
import { isLoggedIn, LandingNav, LandingFooter } from "../landing-shell";
import { getLocale, getDictionary } from "@/lib/i18n/server";

export default async function PricingPage() {
  const [loggedIn, locale] = await Promise.all([isLoggedIn(), getLocale()]);
  const t = getDictionary(locale);
  const p = t.pricing;
  const tiers = [
    { name: p.free.name, badge: null as string | null, amount: p.free.amount, period: p.free.period, desc: p.free.desc, features: p.free.features as readonly string[], cta: p.free.cta, primary: false },
    { name: p.pro.name, badge: p.pro.badge as string | null, amount: p.pro.amount, period: p.pro.period, desc: p.pro.desc, features: p.pro.features as readonly string[], cta: p.pro.cta, primary: true },
    { name: p.team.name, badge: null as string | null, amount: p.team.amount, period: p.team.period, desc: p.team.desc, features: p.team.features as readonly string[], cta: p.team.cta, primary: false },
  ];

  return (
    <div className="landing">
      <LandingNav loggedIn={loggedIn} />

      <section className="landing-hero" style={{ paddingBottom: 8 }}>
        <span className="landing-eyebrow">{p.eyebrow}</span>
        <h1 style={{ fontSize: 36 }}>{p.h1}</h1>
        <p className="lead">{p.lead}</p>
      </section>

      <section className="landing-section landing-section-narrow" style={{ paddingTop: 8, maxWidth: 900 }}>
        <div className="landing-pricing-grid">
          {tiers.map((tier) => (
            <div className={`landing-price-card ${tier.primary ? "featured" : ""}`} key={tier.name}>
              {tier.badge ? <span className="landing-price-badge">{tier.badge}</span> : null}
              <div className="landing-price-name">{tier.name}</div>
              <div className="landing-price-amount">{tier.amount}<span>{tier.period}</span></div>
              <p className="landing-price-desc">{tier.desc}</p>
              <ul className="landing-price-features">
                {tier.features.map((f) => <li key={f}>{f}</li>)}
              </ul>
              <Link href="/sign-up" className={`landing-btn ${tier.primary ? "landing-btn-primary" : ""}`}>{tier.cta}</Link>
            </div>
          ))}
        </div>

        <p className="secondary-text" style={{ textAlign: "center", marginTop: 32 }}>
          {p.disclaimer}
        </p>
      </section>

      <LandingFooter />
    </div>
  );
}
