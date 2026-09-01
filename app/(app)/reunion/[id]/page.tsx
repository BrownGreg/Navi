import Link from "next/link";
import { notFound } from "next/navigation";
import { fetchAuthed } from "@/lib/server-api";
import type { Meeting } from "@/lib/types";
import CrView from "./CrView";

export default async function MeetingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const res = await fetchAuthed(`/meetings/${id}`);
  if (res.status === 404) return notFound();
  const meeting: Meeting = await res.json();

  const hasCR = meeting.status === "ready" && !!meeting.cr;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 20, padding: "26px 34px 16px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
          <span style={{ fontFamily: "var(--font-heading)", fontSize: 26, letterSpacing: "-0.02em" }}>{meeting.title}</span>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span className="tag tag-outline">{meeting.mode === "visio" ? "Visio" : "Dictaphone"}</span>
            <span style={{ fontSize: 12, color: "var(--color-neutral-500)" }}>
              {new Date(meeting.date).toLocaleDateString("fr-FR", { day: "numeric", month: "long" })}
              {meeting.status === "ready" ? ` · ${meeting.durationMin} min` : " · en cours de traitement"}
              {meeting.source === "mock" ? " · mode demo" : ""}
            </span>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {hasCR ? (
            <a href={`/api/meetings/${meeting.id}/pdf`} download className="btn btn-secondary" style={{ fontSize: 12 }}>PDF</a>
          ) : (
            <button className="btn btn-secondary" disabled style={{ fontSize: 12 }}>PDF</button>
          )}
          <Link href={`/cr/${meeting.shareId}`} className="btn btn-secondary" style={{ fontSize: 12 }}>Vue participant</Link>
        </div>
      </div>

      {meeting.status === "processing" || !meeting.cr ? (
        <div style={{ padding: "0 34px" }}>
          <div className="card">Traitement en cours pour cette reunion.</div>
        </div>
      ) : (
        <CrView meeting={meeting} />
      )}
    </div>
  );
}
