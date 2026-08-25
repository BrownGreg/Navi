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
  const res = await fetchAuthed("/calendar/status");
  const connections: CalendarConnection[] = await res.json();

  return (
    <div className="page">
      <div className="top-actions">
        <Link href="/">← Retour</Link>
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
    </div>
  );
}
