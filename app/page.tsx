import Link from "next/link";
import { isLoggedIn } from "./landing-shell";

export default async function LandingPage() {
  const loggedIn = await isLoggedIn();

  return (
    <div style={{ minHeight: "100vh", background: "var(--color-bg)" }}>
      <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 56px", maxWidth: 1240, margin: "0 auto" }}>
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
          <span style={{ width: 9, height: 9, borderRadius: "50%", background: "var(--color-accent)", boxShadow: "0 0 12px var(--color-accent)" }} />
          <span style={{ fontFamily: "var(--font-heading)", fontWeight: 500, fontSize: 15, letterSpacing: "0.01em", color: "var(--color-text)" }}>Navi</span>
        </Link>
        <nav style={{ display: "flex", alignItems: "center", gap: 28, fontSize: 13, color: "var(--color-neutral-400)" }}>
          <a href="#produit" style={{ color: "var(--color-neutral-400)" }}>Produit</a>
          <a href="#conformite" style={{ color: "var(--color-neutral-400)" }}>Conformité</a>
          <a href="#questions" style={{ color: "var(--color-neutral-400)" }}>Questions</a>
          {loggedIn ? (
            <Link href="/dashboard" className="btn btn-primary" style={{ fontSize: 13 }}>Aller à mon espace</Link>
          ) : (
            <>
              <Link href="/sign-in" style={{ color: "var(--color-neutral-400)" }}>Se connecter</Link>
              <Link href="/sign-up" className="btn btn-primary" style={{ fontSize: 13 }}>Créer un compte</Link>
            </>
          )}
        </nav>
      </header>

      <section style={{ maxWidth: 1240, margin: "0 auto", padding: "88px 56px 48px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 24, maxWidth: 720 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ width: 22, height: 1, background: "var(--color-accent)" }} />
            <span style={{ fontSize: 12, letterSpacing: "0.09em", textTransform: "uppercase", color: "var(--color-accent-300)" }}>Comptes rendus de réunion</span>
          </div>
          <h1 style={{ fontFamily: "var(--font-heading)", fontWeight: 500, fontSize: 56, lineHeight: 1.06, letterSpacing: "-0.025em", margin: 0 }}>
            Le compte rendu est prêt avant que vous quittiez la réunion.
          </h1>
          <p style={{ margin: 0, maxWidth: 470, fontSize: 16, lineHeight: 1.6, color: "var(--color-neutral-300)" }}>
            Navi rejoint votre visio ou écoute la salle, puis rend un résumé, les décisions et les actions
            attribuées. Le tout traité en Europe, effacé à la date que vous fixez.
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 4 }}>
            <Link href={loggedIn ? "/dashboard" : "/sign-up"} className="btn btn-primary">
              {loggedIn ? "Aller à mon espace" : "Créer un compte"}
            </Link>
            <a href="#produit" className="btn btn-ghost">Voir un compte rendu</a>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 8 }}>
            <span style={{ fontSize: 12, color: "var(--color-neutral-500)" }}>Compatible</span>
            <span className="tag tag-outline">Google Meet</span>
            <span className="tag tag-outline">Teams</span>
            <span className="tag tag-outline">Zoom</span>
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
                <span className="btn btn-primary btn-block">＋ Nouvelle réunion</span>
                <div style={{ height: 32, borderRadius: "var(--radius-md)", background: "var(--color-neutral-900)", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 10px", fontSize: 12, color: "var(--color-neutral-600)" }}>
                  <span>Rechercher</span>
                  <span style={{ fontSize: 10, padding: "1px 5px", borderRadius: "var(--radius-sm)", background: "var(--color-bg)" }}>⌘K</span>
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                <span style={{ padding: "6px 8px", fontSize: 11, letterSpacing: "0.07em", textTransform: "uppercase", color: "var(--color-neutral-600)" }}>Aujourd&apos;hui</span>
                <div style={{ padding: "11px 12px", borderRadius: "var(--radius-md)", background: "var(--color-surface)", boxShadow: "var(--shadow-sm)", display: "flex", flexDirection: "column", gap: 6 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
                    <span style={{ fontSize: 13, color: "var(--color-neutral-100)" }}>Point produit — sprint 14</span>
                    <span style={{ fontSize: 11, color: "var(--color-neutral-500)" }}>14:00</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                    <span className="tag tag-accent" style={{ fontSize: 10 }}>Visio</span>
                    <span style={{ fontSize: 11, color: "var(--color-neutral-500)" }}>32 min · 5 pers.</span>
                  </div>
                </div>
                <div style={{ padding: "11px 12px", borderRadius: "var(--radius-md)", display: "flex", flexDirection: "column", gap: 6 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
                    <span style={{ fontSize: 13, color: "var(--color-neutral-300)" }}>Entretien candidat</span>
                    <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "var(--color-accent-300)" }}>
                      <span style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--color-accent)", boxShadow: "0 0 8px var(--color-accent)" }} />
                      en cours
                    </span>
                  </div>
                  <div style={{ height: 3, borderRadius: 2, background: "var(--color-neutral-900)", overflow: "hidden" }}>
                    <span style={{ display: "block", width: "62%", height: 3, background: "var(--color-accent)" }} />
                  </div>
                </div>
                <span style={{ padding: "10px 8px 6px", fontSize: 11, letterSpacing: "0.07em", textTransform: "uppercase", color: "var(--color-neutral-600)" }}>Hier</span>
                <div style={{ padding: "11px 12px", borderRadius: "var(--radius-md)", display: "flex", flexDirection: "column", gap: 5 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
                    <span style={{ fontSize: 13, color: "var(--color-neutral-300)" }}>Comité éditorial</span>
                    <span style={{ fontSize: 11, color: "var(--color-neutral-600)" }}>16:15</span>
                  </div>
                  <span style={{ fontSize: 11, color: "var(--color-neutral-600)" }}>Visio · 51 min</span>
                </div>
                <div style={{ padding: "11px 12px", borderRadius: "var(--radius-md)", display: "flex", flexDirection: "column", gap: 5 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
                    <span style={{ fontSize: 13, color: "var(--color-neutral-300)" }}>Suivi client Atlas</span>
                    <span style={{ fontSize: 11, color: "var(--color-neutral-600)" }}>11:00</span>
                  </div>
                  <span style={{ fontSize: 11, color: "var(--color-neutral-600)" }}>Dictaphone · 38 min</span>
                </div>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 20, padding: "22px 28px 14px" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <span style={{ fontFamily: "var(--font-heading)", fontSize: 21, letterSpacing: "-0.018em" }}>Point produit — sprint 14</span>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ display: "flex" }}>
                      <span style={{ width: 20, height: 20, borderRadius: "50%", background: "var(--color-accent-800)", color: "var(--color-accent-200)", fontSize: 9, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 0 2px var(--color-surface)" }}>CM</span>
                      <span style={{ width: 20, height: 20, borderRadius: "50%", background: "var(--color-neutral-800)", color: "var(--color-neutral-300)", fontSize: 9, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 0 2px var(--color-surface)", marginLeft: -6 }}>YB</span>
                      <span style={{ width: 20, height: 20, borderRadius: "50%", background: "var(--color-neutral-800)", color: "var(--color-neutral-300)", fontSize: 9, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 0 2px var(--color-surface)", marginLeft: -6 }}>+3</span>
                    </div>
                    <span style={{ fontSize: 12, color: "var(--color-neutral-500)" }}>2 septembre · 32 min</span>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <span className="btn btn-secondary" style={{ fontSize: 12 }}>PDF</span>
                  <span className="btn btn-primary" style={{ fontSize: 12 }}>Partager</span>
                </div>
              </div>
              <div style={{ padding: "0 28px 14px" }}>
                <div style={{ display: "inline-flex", gap: 2, padding: 3, borderRadius: 999, background: "var(--color-neutral-900)", fontSize: 12, color: "var(--color-neutral-400)" }}>
                  <span style={{ padding: "5px 14px", borderRadius: 999, background: "var(--color-surface)", color: "var(--color-neutral-100)", boxShadow: "var(--shadow-sm)" }}>Résumé</span>
                  <span style={{ padding: "5px 14px", borderRadius: 999 }}>Décisions</span>
                  <span style={{ padding: "5px 14px", borderRadius: 999 }}>Transcript</span>
                </div>
              </div>
              <div style={{ padding: "4px 28px 26px", display: "grid", gridTemplateColumns: "minmax(0, 1fr) 224px", gap: 26 }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                  <p style={{ margin: 0, fontSize: 14.5, lineHeight: 1.75, color: "var(--color-neutral-200)" }}>
                    L&apos;équipe garde le périmètre du sprint et fait passer la refonte du parcours de
                    consentement devant l&apos;export CSV, reporté au sprint 15. Le texte d&apos;invitation
                    sera rédigé avant la prochaine revue.
                  </p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    <span style={{ fontSize: 11, letterSpacing: "0.07em", textTransform: "uppercase", color: "var(--color-neutral-600)" }}>Décisions</span>
                    <div style={{ borderRadius: "var(--radius-md)", background: "var(--color-neutral-900)", padding: "12px 14px", display: "flex", gap: 12 }}>
                      <span style={{ width: 2, borderRadius: 2, background: "var(--color-accent)" }} />
                      <span style={{ flex: 1, fontSize: 13, lineHeight: 1.6, color: "var(--color-neutral-200)" }}>Le consentement passe en deux étapes, avec un message à copier dans l&apos;invitation.</span>
                    </div>
                    <div style={{ borderRadius: "var(--radius-md)", background: "var(--color-neutral-900)", padding: "12px 14px", display: "flex", gap: 12 }}>
                      <span style={{ width: 2, borderRadius: 2, background: "var(--color-accent)" }} />
                      <span style={{ flex: 1, fontSize: 13, lineHeight: 1.6, color: "var(--color-neutral-200)" }}>Export CSV reporté au sprint 15.</span>
                    </div>
                  </div>
                </div>
                <div style={{ borderRadius: "var(--radius-md)", background: "var(--color-neutral-900)", padding: 14, display: "flex", flexDirection: "column", gap: 14 }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
                    <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
                      <span style={{ fontSize: 11, letterSpacing: "0.07em", textTransform: "uppercase", color: "var(--color-neutral-600)" }}>Actions</span>
                      <span style={{ fontSize: 11, color: "var(--color-neutral-500)" }}>0/2</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 9 }}>
                      <span style={{ width: 14, height: 14, border: "1px solid var(--color-neutral-600)", borderRadius: "var(--radius-sm)", marginTop: 1, flexShrink: 0 }} />
                      <span style={{ flex: 1, fontSize: 12.5, lineHeight: 1.45, color: "var(--color-neutral-200)" }}>Texte de consentement<br /><span style={{ fontSize: 11, color: "var(--color-neutral-500)" }}>Camille · 12 sept.</span></span>
                    </div>
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 9 }}>
                      <span style={{ width: 14, height: 14, border: "1px solid var(--color-neutral-600)", borderRadius: "var(--radius-sm)", marginTop: 1, flexShrink: 0 }} />
                      <span style={{ flex: 1, fontSize: 12.5, lineHeight: 1.45, color: "var(--color-neutral-200)" }}>Chiffrer l&apos;export CSV<br /><span style={{ fontSize: 11, color: "var(--color-neutral-500)" }}>Yanis</span></span>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    <span className="tag tag-outline">roadmap</span>
                    <span className="tag tag-outline">RGPD</span>
                  </div>
                  <span style={{ fontSize: 11, color: "var(--color-neutral-500)" }}>Conservation 30 j · Europe</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section style={{ background: "var(--color-section)", backgroundImage: "radial-gradient(70% 140% at 15% 0%, var(--color-section-glow), transparent 70%)" }}>
        <div style={{ maxWidth: 1240, margin: "0 auto", padding: "40px 56px", display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 32 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span style={{ fontFamily: "var(--font-heading)", fontSize: 30, fontWeight: 500, letterSpacing: "-0.02em" }}>3 min</span>
            <span style={{ fontSize: 12, color: "var(--color-neutral-300)" }}>du raccrochage au compte rendu</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span style={{ fontFamily: "var(--font-heading)", fontSize: 30, fontWeight: 500, letterSpacing: "-0.02em" }}>100 %</span>
            <span style={{ fontSize: 12, color: "var(--color-neutral-300)" }}>du traitement en Europe</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span style={{ fontFamily: "var(--font-heading)", fontSize: 30, fontWeight: 500, letterSpacing: "-0.02em" }}>30 j</span>
            <span style={{ fontSize: 12, color: "var(--color-neutral-300)" }}>de conservation par défaut, puis purge</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span style={{ fontFamily: "var(--font-heading)", fontSize: 30, fontWeight: 500, letterSpacing: "-0.02em" }}>0</span>
            <span style={{ fontSize: 12, color: "var(--color-neutral-300)" }}>accès à la caméra, jamais</span>
          </div>
        </div>
      </section>

      <section id="produit" style={{ maxWidth: 1240, margin: "0 auto", padding: "88px 56px", display: "flex", flexDirection: "column", gap: 72 }}>
        <div className="landing-grid2" style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) 460px", gap: 64, alignItems: "center" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <span style={{ fontSize: 12, letterSpacing: "0.09em", textTransform: "uppercase", color: "var(--color-accent-300)" }}>Visio</span>
            <h2 style={{ fontFamily: "var(--font-heading)", fontWeight: 500, fontSize: 30, lineHeight: 1.2, letterSpacing: "-0.02em", margin: 0 }}>Un participant de plus, qui prend des notes</h2>
            <p style={{ margin: 0, fontSize: 15, lineHeight: 1.65, color: "var(--color-neutral-300)", maxWidth: 420 }}>
              Collez le lien Meet, Teams ou Zoom — ou laissez Navi lire votre agenda et rejoindre seul. Le
              bot apparaît sous le nom « Navi Notetaker — enregistrement » : personne n&apos;est enregistré
              à son insu.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 4 }}>
              <div style={{ display: "flex", gap: 10, alignItems: "baseline" }}><span style={{ color: "var(--color-accent)" }}>—</span><span style={{ fontSize: 14, color: "var(--color-neutral-200)" }}>Transcription par locuteur, en direct</span></div>
              <div style={{ display: "flex", gap: 10, alignItems: "baseline" }}><span style={{ color: "var(--color-accent)" }}>—</span><span style={{ fontSize: 14, color: "var(--color-neutral-200)" }}>Auto-join depuis Google Calendar et Outlook</span></div>
            </div>
          </div>
          <div style={{ background: "var(--color-surface)", borderRadius: "var(--radius-lg)", boxShadow: "var(--shadow-sm)", padding: 18, display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--color-accent)", boxShadow: "0 0 10px var(--color-accent)" }} />
              <span style={{ fontSize: 12, color: "var(--color-neutral-300)" }}>En cours · 12:04</span>
              <span style={{ marginLeft: "auto", fontSize: 11, color: "var(--color-neutral-500)" }}>4 participants notifiés</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ display: "flex", gap: 14 }}><span style={{ width: 58, fontSize: 12, color: "var(--color-neutral-500)" }}>Camille</span><span style={{ flex: 1, fontSize: 13, lineHeight: 1.55, color: "var(--color-neutral-200)" }}>On garde le périmètre tel quel, mais le consentement passe devant.</span></div>
              <div style={{ display: "flex", gap: 14 }}><span style={{ width: 58, fontSize: 12, color: "var(--color-neutral-500)" }}>Yanis</span><span style={{ flex: 1, fontSize: 13, lineHeight: 1.55, color: "var(--color-neutral-200)" }}>D&apos;accord — je chiffre l&apos;export cette semaine.</span></div>
              <div style={{ display: "flex", gap: 14 }}><span style={{ width: 58, fontSize: 12, color: "var(--color-neutral-500)" }}>Camille</span><span style={{ flex: 1, fontSize: 13, lineHeight: 1.55, color: "var(--color-neutral-600)" }}>Alors on décale l&apos;export au sprint…</span></div>
            </div>
          </div>
        </div>

        <div className="rule" />

        <div className="landing-grid2" style={{ display: "grid", gridTemplateColumns: "460px minmax(0, 1fr)", gap: 64, alignItems: "center" }}>
          <div style={{ background: "var(--color-surface)", borderRadius: "var(--radius-lg)", boxShadow: "var(--shadow-sm)", padding: 30, display: "flex", flexDirection: "column", alignItems: "center", gap: 18 }}>
            <span style={{ fontSize: 12, color: "var(--color-neutral-500)" }}>Enregistrement · 12:04</span>
            <div style={{ display: "flex", alignItems: "center", gap: 4, height: 52 }}>
              {[14, 26, 42, 20, 50, 16, 34, 24, 44, 12, 30].map((h, i) => (
                <span key={i} style={{ width: 3, height: h, borderRadius: 2, background: i >= 2 && i <= 4 ? "var(--color-accent)" : "var(--color-neutral-700)" }} />
              ))}
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <span className="btn btn-secondary">Pause</span>
              <span className="btn btn-primary">Terminer</span>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <span style={{ fontSize: 12, letterSpacing: "0.09em", textTransform: "uppercase", color: "var(--color-accent-300)" }}>Dictaphone</span>
            <h2 style={{ fontFamily: "var(--font-heading)", fontWeight: 500, fontSize: 30, lineHeight: 1.2, letterSpacing: "-0.02em", margin: 0 }}>En salle, un seul bouton</h2>
            <p style={{ margin: 0, fontSize: 15, lineHeight: 1.65, color: "var(--color-neutral-300)", maxWidth: 420 }}>
              Le micro de l&apos;ordinateur suffit. Rien à installer, aucune caméra sollicitée, et la même
              chaîne de traitement qu&apos;en visio : transcription, modération, compte rendu.
            </p>
          </div>
        </div>
      </section>

      <section id="conformite" style={{ background: "var(--color-neutral-900)" }}>
        <div className="landing-grid2" style={{ maxWidth: 1240, margin: "0 auto", padding: "80px 56px", display: "grid", gridTemplateColumns: "minmax(0, 1fr) 480px", gap: 64, alignItems: "start" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <span style={{ fontSize: 12, letterSpacing: "0.09em", textTransform: "uppercase", color: "var(--color-accent-300)" }}>Conformité</span>
            <h2 style={{ fontFamily: "var(--font-heading)", fontWeight: 500, fontSize: 32, lineHeight: 1.15, letterSpacing: "-0.02em", margin: 0, maxWidth: 340 }}>Un seul sous-traitant IA, en Europe.</h2>
            <p style={{ margin: 0, fontSize: 15, lineHeight: 1.65, color: "var(--color-neutral-300)", maxWidth: 420 }}>
              Une seule société à évaluer dans votre registre de traitement. Les preuves de consentement
              sont conservées à part, et l&apos;effacement d&apos;une réunion est immédiat quand vous le
              demandez.
            </p>
            <Link href="/rgpd" style={{ fontSize: 14 }}>Lire la page RGPD →</Link>
          </div>
          <table className="table" style={{ width: "100%" }}>
            <tbody>
              <tr><td>Transcription et résumé</td><td style={{ textAlign: "right", color: "var(--color-neutral-400)" }}>Mistral (UE)</td></tr>
              <tr><td>Conservation du contenu</td><td style={{ textAlign: "right", color: "var(--color-neutral-400)" }}>30 jours, réglable</td></tr>
              <tr><td>Preuve de consentement</td><td style={{ textAlign: "right", color: "var(--color-neutral-400)" }}>conservée 5 ans</td></tr>
              <tr><td>Droits RGPD</td><td style={{ textAlign: "right", color: "var(--color-neutral-400)" }}>formulaire intégré</td></tr>
              <tr><td>Caméra</td><td style={{ textAlign: "right", color: "var(--color-neutral-400)" }}>jamais utilisée</td></tr>
            </tbody>
          </table>
        </div>
      </section>

      <section id="questions" style={{ maxWidth: 1240, margin: "0 auto", padding: "80px 56px", display: "grid", gridTemplateColumns: "280px minmax(0, 1fr)", gap: 64 }}>
        <h2 style={{ fontFamily: "var(--font-heading)", fontWeight: 500, fontSize: 28, lineHeight: 1.2, letterSpacing: "-0.02em", margin: 0 }}>Les questions qu&apos;on nous pose</h2>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ padding: "18px 0", borderTop: "1px solid var(--color-neutral-800)", display: "flex", flexDirection: "column", gap: 8 }}>
            <span style={{ fontSize: 16, color: "var(--color-neutral-100)" }}>Les participants sont-ils prévenus ?</span>
            <p style={{ margin: 0, fontSize: 14, lineHeight: 1.65, color: "var(--color-neutral-400)", maxWidth: 560 }}>
              Le bot porte un nom explicite dans la liste des participants, et l&apos;organisateur reçoit un
              texte d&apos;invitation à coller, avec un lien où chacun peut refuser.
            </p>
          </div>
          <details className="landing-faq-row">
            <summary>Combien de temps gardez-vous l&apos;audio ?</summary>
            <p>
              Par défaut 30 jours, réglable jusqu&apos;à 1 an au moment de la création de la réunion. La
              suppression peut aussi être demandée à tout moment, par l&apos;organisateur ou un participant.
            </p>
          </details>
          <details className="landing-faq-row">
            <summary>Peut-on lire un compte rendu sans compte ?</summary>
            <p>
              Oui, via le lien de partage envoyé aux participants — accessible sans création de compte.
            </p>
          </details>
          <details className="landing-faq-row landing-faq-row-last">
            <summary>Ça marche avec Teams et Zoom ?</summary>
            <p>
              Oui, Google Meet, Microsoft Teams et Zoom sont pris en charge : la plateforme est détectée
              automatiquement à partir du lien collé.
            </p>
          </details>
        </div>
      </section>

      <section style={{ maxWidth: 1240, margin: "0 auto", padding: "0 56px 96px" }}>
        <div style={{ background: "var(--color-surface)", borderRadius: "var(--radius-lg)", boxShadow: "var(--shadow-sm)", padding: 56, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 40, backgroundImage: "radial-gradient(50% 120% at 85% 50%, var(--color-accent-900), transparent 70%)" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <h2 style={{ fontFamily: "var(--font-heading)", fontWeight: 500, fontSize: 32, lineHeight: 1.15, letterSpacing: "-0.02em", margin: 0, maxWidth: 420 }}>
              {loggedIn ? "Retrouvez vos réunions" : "Le prochain compte rendu s'écrit tout seul."}
            </h2>
            <p style={{ margin: 0, fontSize: 14, color: "var(--color-neutral-400)" }}>
              {loggedIn ? "Votre historique et vos comptes rendus vous attendent." : "Gratuit pour commencer, sans carte bancaire."}
            </p>
          </div>
          <Link href={loggedIn ? "/dashboard" : "/sign-up"} className="btn btn-primary">
            {loggedIn ? "Aller à mon espace" : "Créer un compte"}
          </Link>
        </div>
      </section>

      <footer style={{ borderTop: "1px solid var(--color-neutral-800)" }}>
        <div style={{ maxWidth: 1240, margin: "0 auto", padding: "24px 56px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: 12, color: "var(--color-neutral-500)" }}>Navi</span>
          <div style={{ display: "flex", gap: 20, fontSize: 12 }}>
            <Link href="/aide" style={{ color: "var(--color-neutral-500)" }}>Aide</Link>
            <a href="#questions" style={{ color: "var(--color-neutral-500)" }}>FAQ</a>
            <a href="#conformite" style={{ color: "var(--color-neutral-500)" }}>RGPD</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
