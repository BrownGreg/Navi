import Link from "next/link";
import { notFound } from "next/navigation";
import { fetchAuthed } from "@/lib/server-api";
import type { Meeting } from "@/lib/types";
import ClassifyButton from "./ClassifyButton";

function tonBadgeStyle(ton: string): React.CSSProperties {
  const map: Record<string, { color: string; background: string; border: string }> = {
    positif: { color: "#166534", background: "#dcfce7", border: "#86efac" },
    neutre:  { color: "var(--text-secondary)", background: "var(--surface-1)", border: "var(--border-strong)" },
    negatif: { color: "#9a3412", background: "#ffedd5", border: "#fdba74" },
    tendu:   { color: "var(--danger)", background: "#fee2e2", border: "#fca5a5" },
  };
  const s = map[ton] ?? map.neutre;
  return {
    display: "inline-block",
    fontSize: 12,
    padding: "3px 10px",
    borderRadius: 999,
    border: `1px solid ${s.border}`,
    color: s.color,
    background: s.background,
  };
}

function urgenceBadgeStyle(urgence: string): React.CSSProperties {
  const map: Record<string, { color: string; background: string; border: string }> = {
    faible:  { color: "#1e40af", background: "#dbeafe", border: "#93c5fd" },
    normale: { color: "var(--text-secondary)", background: "var(--surface-1)", border: "var(--border-strong)" },
    haute:   { color: "var(--danger)", background: "#fee2e2", border: "#fca5a5" },
  };
  const s = map[urgence] ?? map.normale;
  return {
    display: "inline-block",
    fontSize: 12,
    padding: "3px 10px",
    borderRadius: 999,
    border: `1px solid ${s.border}`,
    color: s.color,
    background: s.background,
  };
}

export default async function MeetingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const res = await fetchAuthed(`/meetings/${id}`);
  if (res.status === 404) return notFound();
  const meeting: Meeting = await res.json();

  const hasCR = meeting.status === "ready" && !!meeting.cr;
  const hasClassification = !!meeting.classification;
  const showClassifyButton = meeting.status === "ready" && !hasClassification;

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

          {/* Section Classification */}
          {hasClassification && meeting.classification ? (
            <>
              <div className="label" style={{ marginTop: 6 }}>Classification</div>
              <div className="card" style={{ marginBottom: 10 }}>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
                  <div>
                    <span className="muted" style={{ marginRight: 6 }}>Ton global</span>
                    <span style={tonBadgeStyle(meeting.classification.tone)}>
                      {meeting.classification.tone}
                    </span>
                  </div>
                  <div>
                    <span className="muted" style={{ marginRight: 6 }}>Urgence</span>
                    <span style={urgenceBadgeStyle(meeting.classification.urgency)}>
                      {meeting.classification.urgency}
                    </span>
                  </div>
                </div>

                {meeting.classification.themes.length > 0 && (
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
                    {meeting.classification.themes.map((t, i) => (
                      <span className="pill" key={i}>{t}</span>
                    ))}
                  </div>
                )}

                {meeting.classification.perSegment && meeting.classification.perSegment.length > 0 && (
                  <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                      <thead>
                        <tr>
                          <th style={{ textAlign: "left", padding: "4px 8px", color: "var(--text-muted)", fontWeight: 400, borderBottom: "1px solid var(--border)" }}>Intervenant</th>
                          <th style={{ textAlign: "left", padding: "4px 8px", color: "var(--text-muted)", fontWeight: 400, borderBottom: "1px solid var(--border)" }}>Theme</th>
                          <th style={{ textAlign: "left", padding: "4px 8px", color: "var(--text-muted)", fontWeight: 400, borderBottom: "1px solid var(--border)" }}>Ton</th>
                        </tr>
                      </thead>
                      <tbody>
                        {meeting.classification.perSegment.map((seg, i) => (
                          <tr key={i}>
                            <td style={{ padding: "4px 8px", borderBottom: "1px solid var(--border)" }}>{seg.speaker}</td>
                            <td style={{ padding: "4px 8px", borderBottom: "1px solid var(--border)" }}>{seg.theme}</td>
                            <td style={{ padding: "4px 8px", borderBottom: "1px solid var(--border)" }}>
                              <span style={tonBadgeStyle(seg.tone)}>{seg.tone}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          ) : null}

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

      {/* Bouton Classer la reunion */}
      {showClassifyButton && <ClassifyButton meetingId={meeting.id} />}

      <div className="btn-row" style={{ marginTop: showClassifyButton ? 8 : 12 }}>
        {hasCR ? (
          <a
            href={`/api/meetings/${meeting.id}/pdf`}
            download
            style={{ flex: 1, textDecoration: "none" }}
          >
            <button className="btn" style={{ width: "100%", marginTop: 0 }}>⬇ Export PDF</button>
          </a>
        ) : (
          <button className="btn" disabled style={{ flex: 1 }}>⬇ Export PDF</button>
        )}
        <Link href={`/cr/${meeting.shareId}`} style={{ flex: 1 }}>
          <button className="btn">↗ Vue participant</button>
        </Link>
      </div>
    </div>
  );
}
