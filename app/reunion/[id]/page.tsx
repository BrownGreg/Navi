import Link from "next/link";
import { notFound } from "next/navigation";
import { getMeetingById } from "@/lib/store";

export default function MeetingPage({ params }: { params: { id: string } }) {
  const meeting = getMeetingById(params.id);
  if (!meeting) return notFound();

  return (
    <div className="page">
      <div className="top-actions">
        <Link href="/">← Retour</Link>
      </div>

      <div className="row">
        <h1>{meeting.title}</h1>
        <span className="pill">{meeting.mode === "visio" ? "Visio" : "Dictaphone"}</span>
      </div>
      <p className="muted" style={{ marginBottom: 10 }}>
        {new Date(meeting.date).toLocaleString("fr-FR")} — {meeting.durationMin} min
        {meeting.source ? (
          <span className="pill" style={{ marginLeft: 8 }}>
            {meeting.source === "real" ? "API reelle" : "mode demo"}
          </span>
        ) : null}
      </p>

      {meeting.status === "processing" || !meeting.cr ? (
        <div className="card">Traitement en cours pour cette reunion.</div>
      ) : (
        <>
          <div className="label">Resume</div>
          <div className="card">{meeting.cr.resume}</div>

          <div className="label">Decisions</div>
          {meeting.cr.decisions.map((d, i) => (
            <div className="card" key={i}>{d}</div>
          ))}

          <div className="label">Actions</div>
          {meeting.cr.actions.map((a, i) => (
            <div className="card" key={i}>
              <div className="row">
                <span>{a.text}</span>
                <span className="pill">{a.owner}</span>
              </div>
            </div>
          ))}

          <div className="label">Themes</div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
            {meeting.cr.themes.map((t, i) => (
              <span className="pill accent" key={i}>{t}</span>
            ))}
          </div>

          {meeting.transcript ? (
            <details style={{ marginBottom: 14 }}>
              <summary className="secondary-text" style={{ cursor: "pointer" }}>Transcription complete</summary>
              {meeting.transcript.map((s, i) => (
                <div key={i} className="card">
                  <span style={{ fontWeight: 500 }}>{s.speaker}</span> — {s.text}
                </div>
              ))}
            </details>
          ) : null}
        </>
      )}

      <div className="btn-row">
        <button className="btn" disabled>⬇ Export PDF</button>
        <Link href={`/cr/${meeting.shareId}`} style={{ flex: 1 }}>
          <button className="btn">↗ Vue participant</button>
        </Link>
      </div>
    </div>
  );
}
