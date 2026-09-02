import Link from "next/link";
import { fetchAuthed } from "@/lib/server-api";
import { getLocale, getDictionary, localeTag } from "@/lib/i18n/server";

type RgpdRequestType = "access" | "rectification" | "erasure";

type RgpdRequestOut = {
  id: string;
  email: string;
  meetingId: string;
  type: RgpdRequestType;
  createdAt: string;
};

export default async function RgpdRequestsPage() {
  // /api/rgpd-requests filtre deja par organisateur cote serveur (voir
  // ai-service/routers/rgpd.py) : ce que cette page recoit ne concerne que
  // les reunions de l'utilisateur connecte.
  const [res, locale] = await Promise.all([fetchAuthed("/rgpd-requests"), getLocale()]);
  const requests: RgpdRequestOut[] = res.ok ? await res.json() : [];
  const t = getDictionary(locale).app.settingsRgpd;
  const TYPE_LABELS = t.types;

  return (
    <div className="page page-narrow">
      <div className="top-actions">
        <Link href="/dashboard">{t.back}</Link>
      </div>

      <h1>{t.h1}</h1>
      <p className="secondary-text" style={{ marginBottom: 14 }}>{t.intro}</p>

      {requests.length === 0 ? (
        <div className="card">{t.empty}</div>
      ) : (
        requests.map((r) => (
          <div className="card" key={r.id} style={{ marginBottom: 10, padding: 14 }}>
            <div className="row">
              <span style={{ fontWeight: 500 }}>{TYPE_LABELS[r.type] ?? r.type}</span>
              <span className="muted">
                {new Date(r.createdAt).toLocaleDateString(localeTag(locale), {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric"
                })}
              </span>
            </div>
            <p className="secondary-text" style={{ marginTop: 4 }}>{r.email}</p>
            <Link href={`/reunion/${r.meetingId}`} className="muted" style={{ fontSize: 12 }}>
              {t.viewMeeting}
            </Link>
          </div>
        ))
      )}
    </div>
  );
}
