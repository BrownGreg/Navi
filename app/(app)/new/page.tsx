"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/lib/i18n/LocaleProvider";

export default function NewMeetingPage() {
  const [mode, setMode] = useState<"visio" | "dictaphone" | null>(null);
  const [notified, setNotified] = useState(false);
  const router = useRouter();
  const { t } = useI18n();
  const n = t.app.newMeeting;

  function selectMode(next: "visio" | "dictaphone") {
    setMode(next);
    setNotified(false);
  }

  function continueTo() {
    if (!mode) return;
    router.push(mode === "visio" ? "/new/visio/consent" : "/new/dictaphone/consent");
  }

  function cardStyle(active: boolean): React.CSSProperties {
    return {
      textAlign: "left",
      display: "flex",
      flexDirection: "column",
      gap: 6,
      padding: 14,
      borderRadius: "var(--radius-md)",
      cursor: "pointer",
      fontFamily: "inherit",
      background: "var(--color-neutral-900)",
      border: `1px solid ${active ? "var(--accent)" : "transparent"}`,
      color: "inherit",
    };
  }

  return (
    <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", padding: 40 }}>
      <div style={{ width: 520, background: "var(--color-bg)", borderRadius: "var(--radius-lg)", boxShadow: "var(--shadow-lg)", padding: 30, display: "flex", flexDirection: "column", gap: 22 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <span style={{ fontFamily: "var(--font-heading)", fontSize: 21, letterSpacing: "-0.015em" }}>{n.title}</span>
          <span style={{ fontSize: 13, color: "var(--color-neutral-400)" }}>{n.subtitle}</span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <button onClick={() => selectMode("visio")} style={cardStyle(mode === "visio")}>
            <span style={{ fontSize: 14, color: "var(--color-neutral-100)" }}>{n.visioTitle}</span>
            <span style={{ fontSize: 12, lineHeight: 1.5, color: "var(--color-neutral-400)" }}>
              {n.visioDesc}
            </span>
          </button>
          <button onClick={() => selectMode("dictaphone")} style={cardStyle(mode === "dictaphone")}>
            <span style={{ fontSize: 14, color: "var(--color-neutral-100)" }}>{n.dictaTitle}</span>
            <span style={{ fontSize: 12, lineHeight: 1.5, color: "var(--color-neutral-400)" }}>
              {n.dictaDesc}
            </span>
          </button>
        </div>

        {mode ? (
          <label style={{ display: "flex", alignItems: "flex-start", gap: 10, borderTop: "1px solid var(--color-neutral-800)", paddingTop: 16, cursor: "pointer" }}>
            <span style={{ position: "relative", width: 15, height: 15, borderRadius: "var(--radius-sm)", border: "1px solid var(--color-accent)", marginTop: 1, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: notified ? "var(--color-accent)" : "transparent" }}>
              <input
                type="checkbox"
                checked={notified}
                onChange={(e) => setNotified(e.target.checked)}
                style={{ position: "absolute", inset: 0, opacity: 0, margin: 0, cursor: "pointer" }}
              />
              {notified ? <span aria-hidden="true" style={{ fontSize: 11, lineHeight: 1, color: "var(--color-bg)" }}>✓</span> : null}
            </span>
            <span style={{ flex: 1, fontSize: 12.5, lineHeight: 1.55, color: "var(--color-neutral-400)" }}>
              {mode === "visio" ? n.noticeVisio : n.noticeDictaphone}
            </span>
          </label>
        ) : null}

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 9 }}>
          <button onClick={() => router.push("/dashboard")} className="btn btn-secondary">{n.cancel}</button>
          <button onClick={continueTo} className="btn btn-primary" disabled={!mode || !notified}>{n.continue}</button>
        </div>
      </div>
    </div>
  );
}
