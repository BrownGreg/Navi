"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { apiFetch } from "@/lib/api-client";

function ProcessingInner() {
  const params = useSearchParams();
  const router = useRouter();
  const meetingId = params.get("id") ?? "";
  const [crDone, setCrDone] = useState(false);
  const [source, setSource] = useState<"real" | "mock" | null>(null);
  const requestedRef = useRef<string | null>(null);

  useEffect(() => {
    if (!meetingId) return;
    // Garde contre le double appel de React 18 Strict Mode (dev) qui monte,
    // demonte puis remonte cet effet : sans elle, /api/generate-cr etait
    // declenche deux fois pour la meme reunion.
    if (requestedRef.current === meetingId) return;
    requestedRef.current = meetingId;

    apiFetch("/api/generate-cr", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ meetingId })
    })
      .then((r) => r.json())
      .then((data) => {
        setSource(data.source);
        setCrDone(true);
      });
  }, [meetingId]);

  return (
    <div className="page">
      <h1>Traitement en cours</h1>
      <p className="secondary-text" style={{ marginBottom: 14 }}>Cela prend quelques secondes</p>

      <div className="card">✓ Transcription (Voxtral)</div>
      <div className="card">✓ Diarisation des locuteurs</div>
      <div className="card" style={{ color: crDone ? "inherit" : "var(--text-secondary)" }}>
        {crDone ? "✓" : "⟳"} Generation du compte-rendu
        {source ? <span className="pill" style={{ marginLeft: 8 }}>{source === "real" ? "API reelle" : "mode demo"}</span> : null}
      </div>

      <button className="btn btn-primary" disabled={!crDone} onClick={() => router.push(`/reunion/${meetingId}`)}>
        Voir le compte-rendu
      </button>
    </div>
  );
}

export default function ProcessingPage() {
  return (
    <Suspense fallback={<div className="page">Chargement…</div>}>
      <ProcessingInner />
    </Suspense>
  );
}
