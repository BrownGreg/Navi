import Link from "next/link";
import { fetchAuthed } from "@/lib/server-api";
import type { Meeting } from "@/lib/types";
import { SignOutButton } from "../sign-out-button";
import MeetingList from "./MeetingList";

type UpcomingCalendarEvent = {
  title: string;
  provider: "google" | "microsoft";
  startTime: string;
  platform?: "google_meet" | "teams" | "zoom" | null;
};

const PROVIDER_LABELS: Record<UpcomingCalendarEvent["provider"], string> = {
  google: "Google Calendar",
  microsoft: "Outlook",
};

export default async function HomePage() {
  const [meetingsRes, upcomingRes] = await Promise.all([
    fetchAuthed("/meetings"),
    fetchAuthed("/calendar/upcoming"),
  ]);
  const meetings: Meeting[] = await meetingsRes.json();
  const upcoming: UpcomingCalendarEvent[] = upcomingRes.ok ? await upcomingRes.json() : [];

  return (
    <div className="page">
      <div className="row" style={{ marginBottom: 14 }}>
        <div style={{ fontWeight: 500, fontSize: 15 }}>Navi</div>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <Link href="/settings/calendar" style={{ fontSize: 12 }}>Calendriers</Link>
          <Link href="/settings/rgpd" style={{ fontSize: 12 }}>Demandes RGPD</Link>
          <Link href="/aide" style={{ fontSize: 12 }}>Aide</Link>
          <SignOutButton />
        </div>
      </div>

      {upcoming.length > 0 ? (
        <div className="card" style={{ marginBottom: 14, fontSize: 13 }}>
          {upcoming.length === 1 ? "1 reunion sera rejointe automatiquement : " : `${upcoming.length} reunions seront rejointes automatiquement : `}
          {upcoming
            .map(
              (e) =>
                `${e.title} a ${new Date(e.startTime).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })} (${PROVIDER_LABELS[e.provider]})`
            )
            .join(", ")}
        </div>
      ) : null}

      <h1>Historique</h1>

      <MeetingList meetings={meetings} />

      <Link href="/new">
        <button className="btn btn-primary">+ Nouvelle reunion</button>
      </Link>
    </div>
  );
}
