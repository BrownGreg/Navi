import Link from "next/link";
import { fetchAuthed } from "@/lib/server-api";
import DisconnectCalendarButton from "./DisconnectCalendarButton";

type CalendarConnection = {
  provider: "google" | "microsoft";
  connected: boolean;
  accountEmail?: string | null;
  needsReauth: boolean;
  connectedAt?: string | null;
};

type UpcomingCalendarEvent = {
  title: string;
  provider: "google" | "microsoft";
  startTime: string;
  platform?: "google_meet" | "teams" | "zoom" | null;
};

const PROVIDER_LABELS: Record<CalendarConnection["provider"], string> = {
  google: "Google Calendar",
  microsoft: "Microsoft Outlook",
};

export default async function CalendarSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ connected?: string; error?: string }>;
}) {
  const { connected, error } = await searchParams;
  const [res, upcomingRes] = await Promise.all([
    fetchAuthed("/calendar/status"),
    fetchAuthed("/calendar/upcoming"),
  ]);
  const connections: CalendarConnection[] = await res.json();
  const upcoming: UpcomingCalendarEvent[] = upcomingRes.ok ? await upcomingRes.json() : [];

  return (
    <div className="page">
      <div className="top-actions">
        <Link href="/dashboard">← Retour</Link>
      </div>

      <h1>Calendriers</h1>
      <p className="secondary-text" style={{ marginBottom: 14 }}>
        Connectez votre agenda pour que le bot rejoigne automatiquement vos reunions Meet, Teams ou Zoom, sans action de votre part.
      </p>

      {connected ? (
        <div className="card" style={{ color: "var(--accent)", marginBottom: 12 }}>
          {PROVIDER_LABELS[connected as CalendarConnection["provider"]] ?? connected} connecte avec succes.
        </div>
      ) : null}
      {error ? (
        <div className="card" style={{ color: "var(--danger)", marginBottom: 12 }}>
          Echec de la connexion ({error}). Reessayez.
        </div>
      ) : null}

      {connections.map((conn) => (
        <div className="card" key={conn.provider} style={{ marginBottom: 10, padding: 14 }}>
          <div className="row">
            <span style={{ fontWeight: 500 }}>{PROVIDER_LABELS[conn.provider]}</span>
            {conn.connected ? <span className="pill accent">Connecte</span> : <span className="pill">Non connecte</span>}
          </div>

          {conn.connected && conn.accountEmail ? (
            <p className="muted" style={{ marginTop: 4 }}>{conn.accountEmail}</p>
          ) : null}

          {conn.needsReauth ? (
            <p className="muted" style={{ marginTop: 4, color: "var(--danger)" }}>
              La connexion a expire — reconnectez ce calendrier.
            </p>
          ) : null}

          <div style={{ marginTop: 10 }}>
            {conn.connected ? (
              <DisconnectCalendarButton provider={conn.provider} />
            ) : (
              <a href={`/api/calendar/${conn.provider}/connect`}>
                <button className="btn btn-primary">Connecter</button>
              </a>
            )}
          </div>
        </div>
      ))}

      <h2 style={{ fontSize: 15, marginTop: 20, marginBottom: 8 }}>Reunions a venir</h2>
      {upcoming.length === 0 ? (
        <div className="card">Aucune reunion detectee dans les prochaines 60 minutes.</div>
      ) : (
        upcoming.map((e, i) => (
          <div className="card" key={i} style={{ marginBottom: 8, padding: 12 }}>
            <div style={{ fontWeight: 500 }}>{e.title}</div>
            <p className="muted" style={{ marginTop: 2 }}>
              {new Date(e.startTime).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })} —{" "}
              {PROVIDER_LABELS[e.provider]}
              {e.platform ? ` · ${e.platform}` : ""} — rejointe automatiquement
            </p>
          </div>
        ))
      )}
    </div>
  );
}
