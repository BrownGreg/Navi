import Link from "next/link";
import { fetchAuthed } from "@/lib/server-api";
import { getLocale, getDictionary, localeTag } from "@/lib/i18n/server";
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

export default async function CalendarSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ connected?: string; error?: string }>;
}) {
  const [{ connected, error }, res, upcomingRes, locale] = await Promise.all([
    searchParams,
    fetchAuthed("/calendar/status"),
    fetchAuthed("/calendar/upcoming"),
    getLocale(),
  ]);
  const connections: CalendarConnection[] = res.ok ? await res.json() : [];
  const upcoming: UpcomingCalendarEvent[] = upcomingRes.ok ? await upcomingRes.json() : [];
  const t = getDictionary(locale).app.settingsCalendar;
  const PROVIDER_LABELS = t.providers;

  return (
    <div className="page page-narrow">
      <div className="top-actions">
        <Link href="/dashboard">{t.back}</Link>
      </div>

      <h1>{t.h1}</h1>
      <p className="secondary-text" style={{ marginBottom: 14 }}>{t.intro}</p>

      {connected ? (
        <div className="card" style={{ color: "var(--accent)", marginBottom: 12 }}>
          {PROVIDER_LABELS[connected as CalendarConnection["provider"]] ?? connected} {t.connectedSuffix}
        </div>
      ) : null}
      {error ? (
        <div className="card" style={{ color: "var(--danger)", marginBottom: 12 }}>
          {t.errorPrefix} ({error}). {t.errorSuffix}
        </div>
      ) : null}

      {connections.map((conn) => (
        <div className="card" key={conn.provider} style={{ marginBottom: 10, padding: 14 }}>
          <div className="row">
            <span style={{ fontWeight: 500 }}>{PROVIDER_LABELS[conn.provider]}</span>
            {conn.connected ? <span className="pill accent">{t.connectedPill}</span> : <span className="pill">{t.notConnectedPill}</span>}
          </div>

          {conn.connected && conn.accountEmail ? (
            <p className="muted" style={{ marginTop: 4 }}>{conn.accountEmail}</p>
          ) : null}

          {conn.needsReauth ? (
            <p className="muted" style={{ marginTop: 4, color: "var(--danger)" }}>{t.reauthNeeded}</p>
          ) : null}

          <div style={{ marginTop: 10 }}>
            {conn.connected ? (
              <DisconnectCalendarButton provider={conn.provider} />
            ) : (
              <a href={`/api/calendar/${conn.provider}/connect`}>
                <button className="btn btn-primary">{t.connect}</button>
              </a>
            )}
          </div>
        </div>
      ))}

      <h2 style={{ fontSize: 15, marginTop: 20, marginBottom: 8 }}>{t.upcomingTitle}</h2>
      {upcoming.length === 0 ? (
        <div className="card">{t.upcomingEmpty}</div>
      ) : (
        upcoming.map((e, i) => (
          <div className="card" key={i} style={{ marginBottom: 8, padding: 12 }}>
            <div style={{ fontWeight: 500 }}>{e.title}</div>
            <p className="muted" style={{ marginTop: 2 }}>
              {new Date(e.startTime).toLocaleTimeString(localeTag(locale), { hour: "2-digit", minute: "2-digit" })} —{" "}
              {PROVIDER_LABELS[e.provider]}
              {e.platform ? ` · ${e.platform}` : ""} — {t.autoJoined}
            </p>
          </div>
        ))
      )}
    </div>
  );
}
