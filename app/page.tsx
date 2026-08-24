import Link from "next/link";
import { fetchAuthed } from "@/lib/server-api";
import { SignOutButton } from "./sign-out-button";

type Meeting = {
  id: string;
  title: string;
  mode: "visio" | "dictaphone";
  date: string;
  status: "processing" | "ready";
  durationMin: number;
};

export default async function HomePage() {
  const res = await fetchAuthed("/meetings");
  const meetings: Meeting[] = res.ok ? await res.json() : [];

  return (
    <div className="page">
      <div className="row" style={{ marginBottom: 14 }}>
        <div style={{ fontWeight: 500, fontSize: 15 }}>Scribe</div>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <Link href="/participant/consent" style={{ fontSize: 12 }}>Vue participant</Link>
          <SignOutButton />
        </div>
      </div>

      <h1>Historique</h1>
      <p className="secondary-text" style={{ marginBottom: 14 }}>
        {meetings.length} reunion{meetings.length > 1 ? "s" : ""}
      </p>

      {meetings.map((m) => (
        <Link key={m.id} href={`/reunion/${m.id}`} style={{ textDecoration: "none", color: "inherit" }}>
          <div className="card">
            <div className="row">
              <span style={{ fontSize: 14 }}>{m.title}</span>
              <span className="pill">{m.mode === "visio" ? "Visio" : "Dictaphone"}</span>
            </div>
            <div className="muted" style={{ marginTop: 4 }}>
              {new Date(m.date).toLocaleDateString("fr-FR", { day: "numeric", month: "long" })}
              {" — "}
              {m.status === "ready" ? `${m.durationMin} min` : "en cours de traitement"}
            </div>
          </div>
        </Link>
      ))}

      <Link href="/new">
        <button className="btn btn-primary">+ Nouvelle reunion</button>
      </Link>
    </div>
  );
}
