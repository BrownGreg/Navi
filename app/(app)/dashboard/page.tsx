import Link from "next/link";
import { fetchAuthed } from "@/lib/server-api";
import type { Meeting } from "@/lib/types";
import { getLocale, getDictionary } from "@/lib/i18n/server";
import { localeTag, format } from "@/lib/i18n";

// Vrai ecran d'accueil des reunions (voir icone "Reunions" du rail, qui
// pointe ici) : grille complete plutot qu'un rebond vers la plus recente -
// la liste filtrable/recherche vit toujours dans la coquille persistante
// (AppSidebar), cette page-ci sert de vue d'ensemble avec plus d'espace et
// de detail par reunion.
export default async function DashboardPage() {
  const [res, locale] = await Promise.all([fetchAuthed("/meetings"), getLocale()]);
  const meetings: Meeting[] = res.ok ? await res.json() : [];
  const dict = getDictionary(locale);
  const t = dict.app.dashboard;
  const s = dict.app.sidebar;

  if (meetings.length === 0) {
    return (
      <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", padding: 40 }}>
        <div style={{ textAlign: "center", maxWidth: 320 }}>
          <p style={{ fontFamily: "var(--font-heading)", fontSize: 21, margin: "0 0 8px" }}>{t.emptyTitle}</p>
          <p className="secondary-text" style={{ marginBottom: 18 }}>{t.emptyBody}</p>
          <Link href="/new" className="btn btn-primary">{t.newMeeting}</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12, marginBottom: 4 }}>
        <h1 style={{ fontFamily: "var(--font-heading)", fontSize: 24, margin: 0 }}>{t.title}</h1>
        <Link href="/new" className="btn btn-primary">{t.newMeeting}</Link>
      </div>
      <p className="secondary-text" style={{ marginBottom: 22 }}>{format(t.count, { count: meetings.length })}</p>

      <div className="meetings-grid">
        {meetings.map((m) => {
          const processing = m.status === "processing";
          return (
            <Link key={m.id} href={`/reunion/${m.id}`} className="card selectable">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
                <span className="card-title" style={{ fontSize: 15 }}>{m.title}</span>
                {processing ? (
                  <span className="app-row-live">
                    <span className="app-row-live-dot pulse" />
                    {s.live}
                  </span>
                ) : null}
              </div>
              <div className="card-meta">
                <span className={`tag ${m.mode === "visio" ? "tag-accent" : "tag-outline"}`}>
                  {m.mode === "visio" ? s.filterVisio : s.filterDictaphone}
                </span>
                <span>{new Date(m.date).toLocaleDateString(localeTag(locale), { day: "2-digit", month: "short" })}</span>
                {!processing ? <span>{m.durationMin} {s.minutes}</span> : null}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
