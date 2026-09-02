import Link from "next/link";
import { isLoggedIn, LandingNav, LandingFooter } from "../landing-shell";
import { getLocale, getDictionary } from "@/lib/i18n/server";

function Question({ q, children }: { q: string; children: React.ReactNode }) {
  return (
    <details className="landing-faq-item">
      <summary>{q}</summary>
      <div className="secondary-text">{children}</div>
    </details>
  );
}

export default async function FaqPage() {
  const [loggedIn, locale] = await Promise.all([isLoggedIn(), getLocale()]);
  const t = getDictionary(locale);
  const f = t.faq;
  const legal = Object.values(f.legal);
  const technical = Object.values(f.technical);

  return (
    <div className="landing">
      <LandingNav loggedIn={loggedIn} />

      <section className="landing-hero" style={{ paddingBottom: 8 }}>
        <span className="landing-eyebrow">{f.eyebrow}</span>
        <h1 style={{ fontSize: 36 }}>{f.h1}</h1>
        <p className="lead">
          {f.leadBefore} <Link href="/aide">{f.leadLink}</Link>{f.leadAfter}
        </p>
      </section>

      <section className="landing-section landing-section-narrow" style={{ paddingTop: 8 }}>
        <h2 className="landing-faq-group-title">{f.legalGroupTitle}</h2>
        <div className="landing-faq-group">
          {legal.map((item, i) =>
            "qBefore" in item ? (
              <Question key={i} q={item.qBefore}>
                {item.aBefore} <Link href="/rgpd">{item.aLink}</Link> {item.aAfter}
              </Question>
            ) : (
              <Question key={i} q={item.q}>{item.a}</Question>
            )
          )}
        </div>

        <h2 className="landing-faq-group-title" style={{ marginTop: 48 }}>{f.technicalGroupTitle}</h2>
        <div className="landing-faq-group">
          {technical.map((item, i) => (
            <Question key={i} q={item.q}>{item.a}</Question>
          ))}
        </div>
      </section>

      <LandingFooter />
    </div>
  );
}
