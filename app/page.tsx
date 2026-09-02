import Link from "next/link";
import { isLoggedIn } from "./landing-shell";
import { getLocale, getDictionary } from "@/lib/i18n/server";
import { LanguageSwitcher } from "@/lib/i18n/LanguageSwitcher";

export default async function LandingPage() {
  const [loggedIn, locale] = await Promise.all([isLoggedIn(), getLocale()]);
  const t = getDictionary(locale);
  const l = t.landing;

  return (
    <div style={{ minHeight: "100vh", background: "var(--color-bg)" }}>
      <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 56px", maxWidth: 1240, margin: "0 auto" }}>
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
          <img src="/icon.png" alt="" width={22} height={22} />
          <span style={{ fontFamily: "var(--font-heading)", fontWeight: 500, fontSize: 15, letterSpacing: "0.01em", color: "var(--color-text)" }}>{t.nav.brand}</span>
        </Link>
        <nav style={{ display: "flex", alignItems: "center", gap: 28, fontSize: 13, color: "var(--color-neutral-400)" }}>
          <Link href="/pricing" style={{ color: "var(--color-neutral-400)" }}>{t.nav.tarifs}</Link>
          <a href="#produit" style={{ color: "var(--color-neutral-400)" }}>{t.nav.produit}</a>
          <a href="#conformite" style={{ color: "var(--color-neutral-400)" }}>{t.nav.conformite}</a>
          <a href="#questions" style={{ color: "var(--color-neutral-400)" }}>{t.nav.questions}</a>
          {loggedIn ? (
            <Link href="/dashboard" className="btn btn-primary" style={{ fontSize: 13 }}>{t.nav.allerEspace}</Link>
          ) : (
            <>
              <Link href="/sign-in" style={{ color: "var(--color-neutral-400)" }}>{t.nav.seConnecter}</Link>
              <Link href="/sign-up" className="btn btn-primary" style={{ fontSize: 13 }}>{t.nav.creerCompte}</Link>
            </>
          )}
          <LanguageSwitcher />
        </nav>
      </header>

      <section style={{ maxWidth: 1240, margin: "0 auto", padding: "88px 56px 48px" }}>
        <div className="landing-grid2" style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) 420px", gap: 56, alignItems: "center" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ width: 22, height: 1, background: "var(--color-accent)" }} />
              <span style={{ fontSize: 12, letterSpacing: "0.09em", textTransform: "uppercase", color: "var(--color-accent-300)" }}>{l.eyebrow}</span>
            </div>
            <h1 style={{ fontFamily: "var(--font-heading)", fontWeight: 500, fontSize: 56, lineHeight: 1.06, letterSpacing: "-0.025em", margin: 0 }}>
              {l.h1}
            </h1>
            <p style={{ margin: 0, maxWidth: 470, fontSize: 16, lineHeight: 1.6, color: "var(--color-neutral-300)" }}>
              {l.lead}
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 4 }}>
              <Link href={loggedIn ? "/dashboard" : "/sign-up"} className="btn btn-primary">
                {loggedIn ? t.nav.allerEspace : l.ctaPrimary}
              </Link>
              <a href="#produit" className="btn btn-ghost">{l.ctaGhost}</a>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 8 }}>
              <span style={{ fontSize: 12, color: "var(--color-neutral-500)" }}>{l.compatible}</span>
              <span className="tag tag-outline">Google Meet</span>
              <span className="tag tag-outline">Teams</span>
              <span className="tag tag-outline">Zoom</span>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            {l.timeline.map((step, i) => (
              <div
                key={i}
                style={{
                  display: "grid",
                  gridTemplateColumns: "70px minmax(0, 1fr)",
                  gap: 20,
                  padding: "18px 0",
                  borderTop: i === 0 ? "none" : "1px solid var(--color-neutral-800)",
                }}
              >
                <span style={{ fontSize: 12, color: "var(--color-neutral-500)", paddingTop: 2 }}>{step.time}</span>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <span style={{ fontSize: 15, fontWeight: 500, color: "var(--color-neutral-100)" }}>{step.title}</span>
                  <span style={{ fontSize: 13.5, lineHeight: 1.55, color: "var(--color-accent-300)" }}>{step.body}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section aria-hidden="true" style={{ maxWidth: 1240, margin: "0 auto", padding: "0 56px 80px", position: "relative" }}>
        <div style={{ position: "absolute", inset: "-30px 30px auto", height: 220, background: "radial-gradient(50% 80% at 50% 0%, var(--color-accent-900), transparent 70%)", pointerEvents: "none" }} />
        <div style={{ position: "relative", background: "var(--color-surface)", borderRadius: "var(--radius-lg)", boxShadow: "var(--shadow-md)", overflow: "hidden" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "11px 16px", borderBottom: "1px solid var(--color-neutral-800)", background: "var(--color-neutral-900)" }}>
            <div style={{ display: "flex", gap: 6 }}>
              <span style={{ width: 9, height: 9, borderRadius: "50%", background: "var(--color-neutral-700)" }} />
              <span style={{ width: 9, height: 9, borderRadius: "50%", background: "var(--color-neutral-700)" }} />
              <span style={{ width: 9, height: 9, borderRadius: "50%", background: "var(--color-neutral-700)" }} />
            </div>
            <span style={{ margin: "0 auto", padding: "4px 14px", borderRadius: 999, background: "var(--color-bg)", fontSize: 11, color: "var(--color-neutral-500)" }}>navi.app</span>
            <span style={{ width: 22, height: 22, borderRadius: "50%", background: "var(--color-accent-800)", color: "var(--color-accent-200)", fontSize: 10, display: "flex", alignItems: "center", justifyContent: "center" }}>CM</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "290px minmax(0, 1fr)" }}>
            <div style={{ background: "var(--color-bg)", borderRight: "1px solid var(--color-neutral-900)", padding: "16px 12px", display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
                <span className="btn btn-primary btn-block">{l.preview.newMeetingButton}</span>
                <div style={{ height: 32, borderRadius: "var(--radius-md)", background: "var(--color-neutral-900)", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 10px", fontSize: 12, color: "var(--color-neutral-600)" }}>
                  <span>{l.preview.search}</span>
                  <span style={{ fontSize: 10, padding: "1px 5px", borderRadius: "var(--radius-sm)", background: "var(--color-bg)" }}>⌘K</span>
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                <span style={{ padding: "6px 8px", fontSize: 11, letterSpacing: "0.07em", textTransform: "uppercase", color: "var(--color-neutral-600)" }}>{l.preview.today}</span>
                <div style={{ padding: "11px 12px", borderRadius: "var(--radius-md)", background: "var(--color-surface)", boxShadow: "var(--shadow-sm)", display: "flex", flexDirection: "column", gap: 6 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
                    <span style={{ fontSize: 13, color: "var(--color-neutral-100)" }}>{l.preview.meetingA}</span>
                    <span style={{ fontSize: 11, color: "var(--color-neutral-500)" }}>14:00</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                    <span className="tag tag-accent" style={{ fontSize: 10 }}>{l.preview.meetingATag}</span>
                    <span style={{ fontSize: 11, color: "var(--color-neutral-500)" }}>{l.preview.meetingAMeta}</span>
                  </div>
                </div>
                <div style={{ padding: "11px 12px", borderRadius: "var(--radius-md)", display: "flex", flexDirection: "column", gap: 6 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
                    <span style={{ fontSize: 13, color: "var(--color-neutral-300)" }}>{l.preview.meetingB}</span>
                    <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "var(--color-accent-300)" }}>
                      <span style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--color-accent)", boxShadow: "0 0 8px var(--color-accent)" }} />
                      {l.preview.meetingBStatus}
                    </span>
                  </div>
                  <div style={{ height: 3, borderRadius: 2, background: "var(--color-neutral-900)", overflow: "hidden" }}>
                    <span style={{ display: "block", width: "62%", height: 3, background: "var(--color-accent)" }} />
                  </div>
                </div>
                <span style={{ padding: "10px 8px 6px", fontSize: 11, letterSpacing: "0.07em", textTransform: "uppercase", color: "var(--color-neutral-600)" }}>{l.preview.yesterday}</span>
                <div style={{ padding: "11px 12px", borderRadius: "var(--radius-md)", display: "flex", flexDirection: "column", gap: 5 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
                    <span style={{ fontSize: 13, color: "var(--color-neutral-300)" }}>{l.preview.meetingC}</span>
                    <span style={{ fontSize: 11, color: "var(--color-neutral-600)" }}>16:15</span>
                  </div>
                  <span style={{ fontSize: 11, color: "var(--color-neutral-600)" }}>{l.preview.meetingCMeta}</span>
                </div>
                <div style={{ padding: "11px 12px", borderRadius: "var(--radius-md)", display: "flex", flexDirection: "column", gap: 5 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
                    <span style={{ fontSize: 13, color: "var(--color-neutral-300)" }}>{l.preview.meetingD}</span>
                    <span style={{ fontSize: 11, color: "var(--color-neutral-600)" }}>11:00</span>
                  </div>
                  <span style={{ fontSize: 11, color: "var(--color-neutral-600)" }}>{l.preview.meetingDMeta}</span>
                </div>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 20, padding: "22px 28px 14px" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <span style={{ fontFamily: "var(--font-heading)", fontSize: 21, letterSpacing: "-0.018em" }}>{l.preview.meetingA}</span>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ display: "flex" }}>
                      <span style={{ width: 20, height: 20, borderRadius: "50%", background: "var(--color-accent-800)", color: "var(--color-accent-200)", fontSize: 9, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 0 2px var(--color-surface)" }}>CM</span>
                      <span style={{ width: 20, height: 20, borderRadius: "50%", background: "var(--color-neutral-800)", color: "var(--color-neutral-300)", fontSize: 9, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 0 2px var(--color-surface)", marginLeft: -6 }}>YB</span>
                      <span style={{ width: 20, height: 20, borderRadius: "50%", background: "var(--color-neutral-800)", color: "var(--color-neutral-300)", fontSize: 9, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 0 2px var(--color-surface)", marginLeft: -6 }}>+3</span>
                    </div>
                    <span style={{ fontSize: 12, color: "var(--color-neutral-500)" }}>{l.preview.crDate}</span>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <span className="btn btn-secondary" style={{ fontSize: 12 }}>{l.preview.pdf}</span>
                  <span className="btn btn-primary" style={{ fontSize: 12 }}>{l.preview.partager}</span>
                </div>
              </div>
              <div style={{ padding: "0 28px 14px" }}>
                <div style={{ display: "inline-flex", gap: 2, padding: 3, borderRadius: 999, background: "var(--color-neutral-900)", fontSize: 12, color: "var(--color-neutral-400)" }}>
                  <span style={{ padding: "5px 14px", borderRadius: 999, background: "var(--color-surface)", color: "var(--color-neutral-100)", boxShadow: "var(--shadow-sm)" }}>{l.preview.tabResume}</span>
                  <span style={{ padding: "5px 14px", borderRadius: 999 }}>{l.preview.tabDecisions}</span>
                  <span style={{ padding: "5px 14px", borderRadius: 999 }}>{l.preview.tabTranscript}</span>
                </div>
              </div>
              <div style={{ padding: "4px 28px 26px", display: "grid", gridTemplateColumns: "minmax(0, 1fr) 224px", gap: 26 }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                  <p style={{ margin: 0, fontSize: 14.5, lineHeight: 1.75, color: "var(--color-neutral-200)" }}>
                    {l.preview.resumeText}
                  </p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    <span style={{ fontSize: 11, letterSpacing: "0.07em", textTransform: "uppercase", color: "var(--color-neutral-600)" }}>{l.preview.decisionsLabel}</span>
                    <div style={{ borderRadius: "var(--radius-md)", background: "var(--color-neutral-900)", padding: "12px 14px", display: "flex", gap: 12 }}>
                      <span style={{ width: 2, borderRadius: 2, background: "var(--color-accent)" }} />
                      <span style={{ flex: 1, fontSize: 13, lineHeight: 1.6, color: "var(--color-neutral-200)" }}>{l.preview.decision1}</span>
                    </div>
                    <div style={{ borderRadius: "var(--radius-md)", background: "var(--color-neutral-900)", padding: "12px 14px", display: "flex", gap: 12 }}>
                      <span style={{ width: 2, borderRadius: 2, background: "var(--color-accent)" }} />
                      <span style={{ flex: 1, fontSize: 13, lineHeight: 1.6, color: "var(--color-neutral-200)" }}>{l.preview.decision2}</span>
                    </div>
                  </div>
                </div>
                <div style={{ borderRadius: "var(--radius-md)", background: "var(--color-neutral-900)", padding: 14, display: "flex", flexDirection: "column", gap: 14 }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
                    <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
                      <span style={{ fontSize: 11, letterSpacing: "0.07em", textTransform: "uppercase", color: "var(--color-neutral-600)" }}>{l.preview.actionsLabel}</span>
                      <span style={{ fontSize: 11, color: "var(--color-neutral-500)" }}>0/2</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 9 }}>
                      <span style={{ width: 14, height: 14, border: "1px solid var(--color-neutral-600)", borderRadius: "var(--radius-sm)", marginTop: 1, flexShrink: 0 }} />
                      <span style={{ flex: 1, fontSize: 12.5, lineHeight: 1.45, color: "var(--color-neutral-200)" }}>{l.preview.action1}<br /><span style={{ fontSize: 11, color: "var(--color-neutral-500)" }}>{l.preview.action1Owner}</span></span>
                    </div>
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 9 }}>
                      <span style={{ width: 14, height: 14, border: "1px solid var(--color-neutral-600)", borderRadius: "var(--radius-sm)", marginTop: 1, flexShrink: 0 }} />
                      <span style={{ flex: 1, fontSize: 12.5, lineHeight: 1.45, color: "var(--color-neutral-200)" }}>{l.preview.action2}<br /><span style={{ fontSize: 11, color: "var(--color-neutral-500)" }}>{l.preview.action2Owner}</span></span>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    <span className="tag tag-outline">{l.preview.tagRoadmap}</span>
                    <span className="tag tag-outline">{l.preview.tagRgpd}</span>
                  </div>
                  <span style={{ fontSize: 11, color: "var(--color-neutral-500)" }}>{l.preview.retention}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section style={{ background: "var(--color-section)", backgroundImage: "radial-gradient(70% 140% at 15% 0%, var(--color-section-glow), transparent 70%)" }}>
        <div style={{ maxWidth: 1240, margin: "0 auto", padding: "40px 56px", display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 32 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span style={{ fontFamily: "var(--font-heading)", fontSize: 30, fontWeight: 500, letterSpacing: "-0.02em" }}>{l.stats.speedValue}</span>
            <span style={{ fontSize: 12, color: "var(--color-neutral-300)" }}>{l.stats.speedLabel}</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span style={{ fontFamily: "var(--font-heading)", fontSize: 30, fontWeight: 500, letterSpacing: "-0.02em" }}>{l.stats.euValue}</span>
            <span style={{ fontSize: 12, color: "var(--color-neutral-300)" }}>{l.stats.euLabel}</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span style={{ fontFamily: "var(--font-heading)", fontSize: 30, fontWeight: 500, letterSpacing: "-0.02em" }}>{l.stats.retentionValue}</span>
            <span style={{ fontSize: 12, color: "var(--color-neutral-300)" }}>{l.stats.retentionLabel}</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span style={{ fontFamily: "var(--font-heading)", fontSize: 30, fontWeight: 500, letterSpacing: "-0.02em" }}>{l.stats.cameraValue}</span>
            <span style={{ fontSize: 12, color: "var(--color-neutral-300)" }}>{l.stats.cameraLabel}</span>
          </div>
        </div>
      </section>

      <section id="produit" style={{ maxWidth: 1240, margin: "0 auto", padding: "88px 56px", display: "flex", flexDirection: "column", gap: 72 }}>
        <div className="landing-grid2" style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) 460px", gap: 64, alignItems: "center" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <span style={{ fontSize: 12, letterSpacing: "0.09em", textTransform: "uppercase", color: "var(--color-accent-300)" }}>{l.visio.kicker}</span>
            <h2 style={{ fontFamily: "var(--font-heading)", fontWeight: 500, fontSize: 30, lineHeight: 1.2, letterSpacing: "-0.02em", margin: 0 }}>{l.visio.h2}</h2>
            <p style={{ margin: 0, fontSize: 15, lineHeight: 1.65, color: "var(--color-neutral-300)", maxWidth: 420 }}>
              {l.visio.body}
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 4 }}>
              <div style={{ display: "flex", gap: 10, alignItems: "baseline" }}><span style={{ color: "var(--color-accent)" }}>—</span><span style={{ fontSize: 14, color: "var(--color-neutral-200)" }}>{l.visio.bullet1}</span></div>
              <div style={{ display: "flex", gap: 10, alignItems: "baseline" }}><span style={{ color: "var(--color-accent)" }}>—</span><span style={{ fontSize: 14, color: "var(--color-neutral-200)" }}>{l.visio.bullet2}</span></div>
            </div>
          </div>
          <div style={{ background: "var(--color-surface)", borderRadius: "var(--radius-lg)", boxShadow: "var(--shadow-sm)", padding: 18, display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--color-accent)", boxShadow: "0 0 10px var(--color-accent)" }} />
              <span style={{ fontSize: 12, color: "var(--color-neutral-300)" }}>{l.visio.demoStatus}</span>
              <span style={{ marginLeft: "auto", fontSize: 11, color: "var(--color-neutral-500)" }}>{l.visio.demoNotified}</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ display: "flex", gap: 14 }}><span style={{ width: 58, fontSize: 12, color: "var(--color-neutral-500)" }}>Camille</span><span style={{ flex: 1, fontSize: 13, lineHeight: 1.55, color: "var(--color-neutral-200)" }}>{l.visio.demoLine1}</span></div>
              <div style={{ display: "flex", gap: 14 }}><span style={{ width: 58, fontSize: 12, color: "var(--color-neutral-500)" }}>Yanis</span><span style={{ flex: 1, fontSize: 13, lineHeight: 1.55, color: "var(--color-neutral-200)" }}>{l.visio.demoLine2}</span></div>
              <div style={{ display: "flex", gap: 14 }}><span style={{ width: 58, fontSize: 12, color: "var(--color-neutral-500)" }}>Camille</span><span style={{ flex: 1, fontSize: 13, lineHeight: 1.55, color: "var(--color-neutral-600)" }}>{l.visio.demoLine3}</span></div>
            </div>
          </div>
        </div>

        <div className="rule" />

        <div className="landing-grid2" style={{ display: "grid", gridTemplateColumns: "460px minmax(0, 1fr)", gap: 64, alignItems: "center" }}>
          <div style={{ background: "var(--color-surface)", borderRadius: "var(--radius-lg)", boxShadow: "var(--shadow-sm)", padding: 30, display: "flex", flexDirection: "column", alignItems: "center", gap: 18 }}>
            <span style={{ fontSize: 12, color: "var(--color-neutral-500)" }}>{l.dictaphone.demoStatus}</span>
            <div style={{ display: "flex", alignItems: "center", gap: 4, height: 52 }}>
              {[14, 26, 42, 20, 50, 16, 34, 24, 44, 12, 30].map((h, i) => (
                <span key={i} style={{ width: 3, height: h, borderRadius: 2, background: i >= 2 && i <= 4 ? "var(--color-accent)" : "var(--color-neutral-700)" }} />
              ))}
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <span className="btn btn-secondary">{l.dictaphone.pause}</span>
              <span className="btn btn-primary">{l.dictaphone.terminer}</span>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <span style={{ fontSize: 12, letterSpacing: "0.09em", textTransform: "uppercase", color: "var(--color-accent-300)" }}>{l.dictaphone.kicker}</span>
            <h2 style={{ fontFamily: "var(--font-heading)", fontWeight: 500, fontSize: 30, lineHeight: 1.2, letterSpacing: "-0.02em", margin: 0 }}>{l.dictaphone.h2}</h2>
            <p style={{ margin: 0, fontSize: 15, lineHeight: 1.65, color: "var(--color-neutral-300)", maxWidth: 420 }}>
              {l.dictaphone.body}
            </p>
          </div>
        </div>
      </section>

      <section id="conformite" style={{ background: "var(--color-neutral-900)" }}>
        <div className="landing-grid2" style={{ maxWidth: 1240, margin: "0 auto", padding: "80px 56px", display: "grid", gridTemplateColumns: "minmax(0, 1fr) 480px", gap: 64, alignItems: "start" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <span style={{ fontSize: 12, letterSpacing: "0.09em", textTransform: "uppercase", color: "var(--color-accent-300)" }}>{l.conformite.kicker}</span>
            <h2 style={{ fontFamily: "var(--font-heading)", fontWeight: 500, fontSize: 32, lineHeight: 1.15, letterSpacing: "-0.02em", margin: 0, maxWidth: 340 }}>{l.conformite.h2}</h2>
            <p style={{ margin: 0, fontSize: 15, lineHeight: 1.65, color: "var(--color-neutral-300)", maxWidth: 420 }}>
              {l.conformite.body}
            </p>
            <Link href="/rgpd" style={{ fontSize: 14 }}>{l.conformite.link}</Link>
          </div>
          <table className="table" style={{ width: "100%" }}>
            <tbody>
              {Object.values(l.conformite.table).map(([label, value]) => (
                <tr key={label}><td>{label}</td><td style={{ textAlign: "right", color: "var(--color-neutral-400)" }}>{value}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section id="questions" style={{ maxWidth: 1240, margin: "0 auto", padding: "80px 56px", display: "grid", gridTemplateColumns: "280px minmax(0, 1fr)", gap: 64 }}>
        <h2 style={{ fontFamily: "var(--font-heading)", fontWeight: 500, fontSize: 28, lineHeight: 1.2, letterSpacing: "-0.02em", margin: 0 }}>{l.questions.h2}</h2>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ padding: "18px 0", borderTop: "1px solid var(--color-neutral-800)", display: "flex", flexDirection: "column", gap: 8 }}>
            <span style={{ fontSize: 16, color: "var(--color-neutral-100)" }}>{l.questions.q1.q}</span>
            <p style={{ margin: 0, fontSize: 14, lineHeight: 1.65, color: "var(--color-neutral-400)", maxWidth: 560 }}>
              {l.questions.q1.a}
            </p>
          </div>
          <details className="landing-faq-row">
            <summary>{l.questions.q2.q}</summary>
            <p>{l.questions.q2.a}</p>
          </details>
          <details className="landing-faq-row">
            <summary>{l.questions.q3.q}</summary>
            <p>{l.questions.q3.a}</p>
          </details>
          <details className="landing-faq-row landing-faq-row-last">
            <summary>{l.questions.q4.q}</summary>
            <p>{l.questions.q4.a}</p>
          </details>
        </div>
      </section>

      <section style={{ maxWidth: 1240, margin: "0 auto", padding: "0 56px 96px" }}>
        <div style={{ background: "var(--color-surface)", borderRadius: "var(--radius-lg)", boxShadow: "var(--shadow-sm)", padding: 56, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 40, backgroundImage: "radial-gradient(50% 120% at 85% 50%, var(--color-accent-900), transparent 70%)" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <h2 style={{ fontFamily: "var(--font-heading)", fontWeight: 500, fontSize: 32, lineHeight: 1.15, letterSpacing: "-0.02em", margin: 0, maxWidth: 420 }}>
              {loggedIn ? l.finalCta.loggedInH2 : l.finalCta.loggedOutH2}
            </h2>
            <p style={{ margin: 0, fontSize: 14, color: "var(--color-neutral-400)" }}>
              {loggedIn ? l.finalCta.loggedInBody : l.finalCta.loggedOutBody}
            </p>
          </div>
          <Link href={loggedIn ? "/dashboard" : "/sign-up"} className="btn btn-primary">
            {loggedIn ? t.nav.allerEspace : l.ctaPrimary}
          </Link>
        </div>
      </section>

      <footer style={{ borderTop: "1px solid var(--color-neutral-800)" }}>
        <div style={{ maxWidth: 1240, margin: "0 auto", padding: "24px 56px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: 12, color: "var(--color-neutral-500)" }}>{t.nav.brand}</span>
          <div style={{ display: "flex", gap: 20, fontSize: 12 }}>
            <Link href="/aide" style={{ color: "var(--color-neutral-500)" }}>{l.footer.aide}</Link>
            <a href="#questions" style={{ color: "var(--color-neutral-500)" }}>{l.footer.faq}</a>
            <a href="#conformite" style={{ color: "var(--color-neutral-500)" }}>{l.footer.rgpd}</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
