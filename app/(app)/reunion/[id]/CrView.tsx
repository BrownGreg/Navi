"use client";

import { useState } from "react";
import type { Meeting } from "@/lib/types";
import { useI18n } from "@/lib/i18n/LocaleProvider";
import { format } from "@/lib/i18n";
import { apiFetch } from "@/lib/api-client";
import ClassifyButton from "./ClassifyButton";

type Tab = "resume" | "decisions" | "transcript" | "analyse";

const ACTION_PRIORITIES = ["P0", "P1", "P2", "P3", "P4", "P5"] as const;

function tonBadgeStyle(ton: string): React.CSSProperties {
  const map: Record<string, { color: string; background: string; border: string }> = {
    positif: { color: "#7FE0A0", background: "rgba(47, 158, 88, 0.15)", border: "rgba(127, 224, 160, 0.4)" },
    neutre: { color: "var(--text-secondary)", background: "var(--surface-1)", border: "var(--border-strong)" },
    negatif: { color: "#F5B87A", background: "rgba(219, 143, 40, 0.15)", border: "rgba(245, 184, 122, 0.4)" },
    tendu: { color: "var(--danger)", background: "rgba(242, 85, 90, 0.12)", border: "rgba(242, 85, 90, 0.4)" },
  };
  const s = map[ton] ?? map.neutre;
  return { display: "inline-block", fontSize: 12, padding: "3px 10px", borderRadius: 999, border: `1px solid ${s.border}`, color: s.color, background: s.background };
}

function urgenceBadgeStyle(urgence: string): React.CSSProperties {
  const map: Record<string, { color: string; background: string; border: string }> = {
    faible: { color: "var(--color-accent-300)", background: "var(--color-accent-800)", border: "transparent" },
    normale: { color: "var(--text-secondary)", background: "var(--surface-1)", border: "var(--border-strong)" },
    haute: { color: "var(--danger)", background: "rgba(242, 85, 90, 0.12)", border: "rgba(242, 85, 90, 0.4)" },
  };
  const s = map[urgence] ?? map.normale;
  return { display: "inline-block", fontSize: 12, padding: "3px 10px", borderRadius: 999, border: `1px solid ${s.border}`, color: s.color, background: s.background };
}

export default function CrView({ meeting: initialMeeting, initialTab = "resume" }: { meeting: Meeting; initialTab?: Tab }) {
  const { t } = useI18n();
  const c = t.app.crView;
  const p = t.app.actionPriority;
  const [meeting, setMeeting] = useState(initialMeeting);
  const hasClassification = !!meeting.classification;
  const showClassifyButton = meeting.status === "ready" && !hasClassification;
  const tabs: { id: Tab; label: string }[] = [
    { id: "resume", label: c.tabResume },
    { id: "decisions", label: c.tabDecisions },
    { id: "transcript", label: c.tabTranscript },
    ...(hasClassification ? [{ id: "analyse" as Tab, label: c.tabAnalyse }] : []),
  ];
  const [tab, setTab] = useState<Tab>(initialTab);
  const [pendingIndex, setPendingIndex] = useState<number | null>(null);
  const [errorIndex, setErrorIndex] = useState<number | null>(null);

  async function updateAction(index: number, patch: { priority?: string | null; done?: boolean }) {
    if (!meeting.cr) return;
    const current = meeting.cr.actions[index];
    setPendingIndex(index);
    setErrorIndex(null);
    const res = await apiFetch(`/api/meetings/${meeting.id}/actions/${index}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        priority: patch.priority !== undefined ? patch.priority || null : current.priority ?? null,
        done: patch.done !== undefined ? patch.done : current.done ?? false,
      }),
    });
    setPendingIndex(null);
    if (res.ok) {
      setMeeting(await res.json());
    } else {
      setErrorIndex(index);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "auto" }}>
      <div style={{ padding: "0 34px 16px" }}>
        <div style={{ display: "inline-flex", gap: 2, padding: 3, borderRadius: 999, background: "var(--color-neutral-900)", fontSize: 12, color: "var(--color-neutral-400)" }}>
          {tabs.map((tb) => (
            <button
              key={tb.id}
              onClick={() => setTab(tb.id)}
              style={{
                padding: "6px 15px",
                borderRadius: 999,
                border: "none",
                cursor: "pointer",
                font: "inherit",
                background: tab === tb.id ? "var(--color-surface)" : "transparent",
                color: tab === tb.id ? "var(--color-neutral-100)" : "var(--color-neutral-400)",
                boxShadow: tab === tb.id ? "var(--shadow-sm)" : "none",
              }}
            >
              {tb.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: "0 34px 34px", display: "grid", gridTemplateColumns: "minmax(0, 1fr) 250px", gap: 28, alignItems: "start" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 20, minWidth: 0 }}>
          {tab === "resume" && meeting.cr && (
            <p style={{ margin: 0, fontSize: 15, lineHeight: 1.75, color: "var(--color-neutral-200)", maxWidth: 640 }}>{meeting.cr.resume}</p>
          )}

          {tab === "decisions" && meeting.cr && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {meeting.cr.decisions.map((d, i) => (
                <div key={i} style={{ borderRadius: "var(--radius-md)", background: "var(--color-neutral-900)", padding: "13px 15px", display: "flex", gap: 12 }}>
                  <span style={{ width: 2, borderRadius: 2, background: "var(--accent)" }} />
                  <span style={{ flex: 1, fontSize: 13.5, lineHeight: 1.6, color: "var(--color-neutral-200)" }}>{d}</span>
                </div>
              ))}
              {meeting.cr.decisions.length === 0 && <p className="secondary-text">{c.noDecisions}</p>}
            </div>
          )}

          {tab === "transcript" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {meeting.transcript && meeting.transcript.length > 0 ? (
                meeting.transcript.map((s, i) => (
                  <div key={i} style={{ display: "flex", gap: 14 }}>
                    <span style={{ width: 64, fontSize: 12, color: "var(--color-neutral-500)", flexShrink: 0 }}>{s.speaker}</span>
                    <span style={{ flex: 1, fontSize: 14, lineHeight: 1.7, color: "var(--color-neutral-200)" }}>{s.text}</span>
                  </div>
                ))
              ) : (
                <p className="secondary-text">{c.noTranscript}</p>
              )}
            </div>
          )}

          {tab === "analyse" && meeting.classification && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <div>
                  <span className="muted" style={{ marginRight: 6 }}>{c.tonGlobal}</span>
                  <span style={tonBadgeStyle(meeting.classification.tone)}>{meeting.classification.tone}</span>
                </div>
                <div>
                  <span className="muted" style={{ marginRight: 6 }}>{c.urgence}</span>
                  <span style={urgenceBadgeStyle(meeting.classification.urgency)}>{meeting.classification.urgency}</span>
                </div>
              </div>

              {meeting.classification.themes.length > 0 && (
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {meeting.classification.themes.map((theme, i) => (
                    <span className="tag tag-outline" key={i}>{theme}</span>
                  ))}
                </div>
              )}

              {meeting.classification.perSegment && meeting.classification.perSegment.length > 0 && (
                <table className="table" style={{ width: "100%" }}>
                  <thead>
                    <tr>
                      <td style={{ color: "var(--text-muted)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em" }}>{c.intervenant}</td>
                      <td style={{ color: "var(--text-muted)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em" }}>{c.theme}</td>
                      <td style={{ color: "var(--text-muted)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em" }}>{c.ton}</td>
                    </tr>
                  </thead>
                  <tbody>
                    {meeting.classification.perSegment.map((seg, i) => (
                      <tr key={i}>
                        <td>{seg.speaker}</td>
                        <td>{seg.theme}</td>
                        <td><span style={tonBadgeStyle(seg.tone)}>{seg.tone}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {showClassifyButton && (
            <div style={{ marginTop: 4 }}>
              <ClassifyButton meetingId={meeting.id} />
            </div>
          )}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {meeting.cr && meeting.cr.actions.length > 0 && (
            <div style={{ borderRadius: "var(--radius-md)", background: "var(--color-neutral-900)", padding: 15, display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
                <span style={{ fontSize: 11, letterSpacing: "0.07em", textTransform: "uppercase", color: "var(--color-neutral-600)" }}>{c.actions}</span>
                <span style={{ fontSize: 11, color: "var(--color-neutral-500)" }}>{meeting.cr.actions.length}</span>
              </div>
              {meeting.cr.actions.map((a, i) => (
                <div key={i} style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 9 }}>
                    <input
                      type="checkbox"
                      checked={!!a.done}
                      disabled={pendingIndex === i}
                      onChange={(e) => updateAction(i, { done: e.target.checked })}
                      style={{ width: 14, height: 14, marginTop: 1, flexShrink: 0, accentColor: "var(--color-accent)" }}
                    />
                    <span
                      style={{
                        flex: 1,
                        fontSize: 12.5,
                        lineHeight: 1.45,
                        color: a.done ? "var(--color-neutral-500)" : "var(--color-neutral-200)",
                        textDecoration: a.done ? "line-through" : "none",
                      }}
                    >
                      {a.text}
                      <br />
                      <span style={{ fontSize: 11, color: "var(--color-neutral-500)" }}>{a.owner}</span>
                    </span>
                    <select
                      value={a.priority ?? ""}
                      disabled={pendingIndex === i}
                      onChange={(e) => updateAction(i, { priority: e.target.value })}
                      aria-label={p.label}
                      style={{
                        fontSize: 10,
                        background: "var(--color-neutral-800)",
                        color: "var(--color-neutral-300)",
                        border: "1px solid var(--color-neutral-700)",
                        borderRadius: "var(--radius-sm)",
                        padding: "2px 3px",
                        flexShrink: 0,
                      }}
                    >
                      <option value="">{p.none}</option>
                      {ACTION_PRIORITIES.map((prio) => (
                        <option key={prio} value={prio}>{prio}</option>
                      ))}
                    </select>
                  </div>
                  {errorIndex === i ? (
                    <span style={{ fontSize: 10.5, color: "var(--danger)", marginLeft: 23 }}>{p.saveError}</span>
                  ) : null}
                </div>
              ))}
            </div>
          )}

          {meeting.cr && meeting.cr.themes.length > 0 && (
            <div style={{ borderRadius: "var(--radius-md)", background: "var(--color-neutral-900)", padding: 15, display: "flex", flexDirection: "column", gap: 10 }}>
              <span style={{ fontSize: 11, letterSpacing: "0.07em", textTransform: "uppercase", color: "var(--color-neutral-600)" }}>{c.themes}</span>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {meeting.cr.themes.map((theme, i) => (
                  <span className="tag tag-outline" key={i}>{theme}</span>
                ))}
              </div>
              <span style={{ fontSize: 11, lineHeight: 1.5, color: "var(--color-neutral-500)" }}>
                {format(c.conservation, { days: meeting.retentionDays })}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
