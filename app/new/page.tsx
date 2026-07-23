"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function NewMeetingPage() {
  const [mode, setMode] = useState<"visio" | "dictaphone" | null>(null);
  const router = useRouter();

  function continueTo() {
    if (!mode) return;
    router.push(mode === "visio" ? "/new/visio/consent" : "/new/dictaphone/consent");
  }

  return (
    <div className="page">
      <div className="top-actions">
        <Link href="/">← Retour</Link>
      </div>

      <h1>Nouvelle reunion</h1>
      <p className="secondary-text" style={{ marginBottom: 14 }}>Choisir un mode de capture</p>

      <div
        className={`card selectable ${mode === "visio" ? "selected" : ""}`}
        style={{ padding: 16, textAlign: "center" }}
        onClick={() => setMode("visio")}
      >
        <div className="hatch" style={{ width: 36, height: 36, borderRadius: "50%", margin: "0 auto 8px" }} />
        <div style={{ fontSize: 14, fontWeight: 500 }}>Mode visio</div>
        <div className="muted">Google Meet, Teams ou Zoom — un bot Vexa rejoint la reunion</div>
      </div>

      <div
        className={`card selectable ${mode === "dictaphone" ? "selected" : ""}`}
        style={{ padding: 16, textAlign: "center" }}
        onClick={() => setMode("dictaphone")}
      >
        <div className="hatch" style={{ width: 36, height: 36, borderRadius: "50%", margin: "0 auto 8px" }} />
        <div style={{ fontSize: 14, fontWeight: 500 }}>Mode dictaphone</div>
        <div className="muted">Micro du navigateur — pipeline fonctionnel de bout en bout</div>
      </div>

      <button className="btn btn-primary" disabled={!mode} onClick={continueTo}>
        Continuer
      </button>
    </div>
  );
}
