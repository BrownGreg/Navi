"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

const NAMES = ["Kim", "Participant 2", "Participant 3", "Participant 4"];

function VisioLiveInner() {
  const params = useSearchParams();
  const router = useRouter();
  const meetingId = params.get("id") ?? "";
  const [ending, setEnding] = useState(false);

  async function endMeeting() {
    setEnding(true);
    await fetch("/api/mock-complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ meetingId, durationMin: 12 })
    });
    router.push(`/reunion/${meetingId}`);
  }

  return (
    <div className="page">
      <h1>Reunion en cours</h1>
      <p className="secondary-text" style={{ marginBottom: 14 }}>Mode visio</p>

      <div className="row" style={{ marginBottom: 10 }}>
        <span className="pill rec">● REC 12:04</span>
        <span className="muted">4 participants</span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 10 }}>
        {NAMES.map((name) => (
          <div key={name} className="hatch" style={{ height: 90, borderRadius: "var(--radius)", display: "flex", alignItems: "flex-end", padding: 6 }}>
            <span className="pill" style={{ background: "var(--surface-2)" }}>{name}</span>
          </div>
        ))}
      </div>

      <p className="muted" style={{ textAlign: "center", marginBottom: 10 }}>
        Grille video non fonctionnelle — placeholder de parcours (Scribe n&apos;accede jamais a la camera)
      </p>

      <button className="btn btn-primary" disabled={ending} onClick={endMeeting}>
        {ending ? "Generation du compte-rendu…" : "Terminer la reunion"}
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
