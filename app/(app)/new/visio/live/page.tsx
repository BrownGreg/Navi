"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { apiFetch } from "@/lib/api-client";

type LiveSegment = { speaker: string; text: string; start: number };

function VisioLiveInner() {
  const params = useSearchParams();
  const router = useRouter();
  const meetingId = params.get("id") ?? "";
  const [seconds, setSeconds] = useState(0);
  const [segments, setSegments] = useState<LiveSegment[]>([]);
  const [source, setSource] = useState<"real" | "mock" | null>(null);
  const [ending, setEnding] = useState(false);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!meetingId) return;

    timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);

    async function poll() {
      try {
        const res = await apiFetch(`/api/visio/${meetingId}/transcript`);
        if (!res.ok) return;
        const data = await res.json();
        setSegments(data.segments ?? []);
        setSource(data.source ?? null);
      } catch {
        // silencieux : on reessaie au prochain tick
      }
    }
    poll();
    pollRef.current = setInterval(poll, 3000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [meetingId]);

  async function endMeeting() {
    setEnding(true);
    if (timerRef.current) clearInterval(timerRef.current);
    if (pollRef.current) clearInterval(pollRef.current);

    await apiFetch(`/api/visio/${meetingId}/leave`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ durationMin: Math.max(1, Math.round(seconds / 60)) })
    });
    router.push(`/new/visio/processing?id=${meetingId}`);
  }

  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "20px 34px", borderBottom: "1px solid var(--color-neutral-900)" }}>
        <span className="pulse" style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--accent)", boxShadow: "0 0 12px var(--accent)" }} />
        <span style={{ fontFamily: "var(--font-heading)", fontSize: 17 }}>Reunion en cours</span>
        <span style={{ fontSize: 13, color: "var(--color-neutral-400)" }}>· {mm}:{ss}</span>
        <button onClick={endMeeting} disabled={ending} className="btn btn-primary" style={{ marginLeft: "auto", fontSize: 12 }}>
          {ending ? "Fin de la reunion…" : "Terminer"}
        </button>
      </div>

      <div style={{ flex: 1, display: "grid", gridTemplateColumns: "minmax(0, 1fr) 280px", minHeight: 0 }}>
        <div style={{ padding: "22px 34px", display: "flex", flexDirection: "column", gap: 16, overflow: "auto" }}>
          <span style={{ fontSize: 11, letterSpacing: "0.07em", textTransform: "uppercase", color: "var(--color-neutral-600)" }}>Transcription en direct</span>
          {segments.length === 0 ? (
            <p className="secondary-text">En attente des premiers segments…</p>
          ) : (
            segments.map((s, i) => (
              <div key={i} style={{ display: "flex", gap: 14 }}>
                <span style={{ width: 64, fontSize: 12, color: "var(--color-neutral-500)", flexShrink: 0 }}>{s.speaker}</span>
                <span style={{ flex: 1, fontSize: 14, lineHeight: 1.7, color: "var(--color-neutral-200)" }}>{s.text}</span>
              </div>
            ))
          )}
        </div>

        <div style={{ borderLeft: "1px solid var(--color-neutral-900)", padding: "22px 20px", display: "flex", flexDirection: "column", gap: 18, background: "var(--color-bg)" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <span style={{ fontSize: 11, letterSpacing: "0.07em", textTransform: "uppercase", color: "var(--color-neutral-600)" }}>Reunion</span>
            {source ? <span className="tag tag-outline">{source === "real" ? "API reelle" : "mode demo"}</span> : null}
            <span style={{ fontSize: 12.5, lineHeight: 1.55, color: "var(--color-neutral-400)" }}>
              Le resume, les decisions et les actions seront generes automatiquement a la fin de la reunion.
            </span>
          </div>
          <span style={{ marginTop: "auto", fontSize: 11, lineHeight: 1.55, color: "var(--color-neutral-500)" }}>
            Le bot est visible dans la liste des participants. Aucune camera n&apos;est utilisee : seul
            l&apos;audio est capte.
          </span>
        </div>
      </div>
    </div>
  );
}

export default function VisioLivePage() {
  return (
    <Suspense fallback={<div style={{ padding: 34 }}>Chargement…</div>}>
      <VisioLiveInner />
    </Suspense>
  );
}
