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
    <div className="page">
      <h1>Reunion en cours</h1>
      <p className="secondary-text" style={{ marginBottom: 14 }}>Mode visio — bot Vexa connecte</p>

      <div className="row" style={{ marginBottom: 10 }}>
        <span className="pill rec">● REC {mm}:{ss}</span>
        {source ? <span className="pill">{source === "real" ? "API reelle" : "mode demo"}</span> : null}
      </div>

      <div className="hatch" style={{ height: 70, borderRadius: "var(--radius)", marginBottom: 6 }} />
      <p className="muted" style={{ textAlign: "center", marginBottom: 14 }}>
        Grille video non fonctionnelle — Scribe n&apos;accede jamais a la camera, seul l&apos;audio est capte par le bot
      </p>

      <div className="label">Transcription en direct</div>
      <div style={{ maxHeight: 260, overflowY: "auto", marginBottom: 14 }}>
        {segments.length === 0 ? (
          <div className="card muted">En attente des premiers segments…</div>
        ) : (
          segments.map((s, i) => (
            <div key={i} className="card">
              <span style={{ fontWeight: 500 }}>{s.speaker}</span> — {s.text}
            </div>
          ))
        )}
      </div>

      <button className="btn btn-primary" disabled={ending} onClick={endMeeting}>
        {ending ? "Fin de la reunion…" : "Terminer la reunion"}
      </button>
    </div>
  );
}

export default function VisioLivePage() {
  return (
    <Suspense fallback={<div className="page">Chargement…</div>}>
      <VisioLiveInner />
    </Suspense>
  );
}
