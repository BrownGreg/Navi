"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function DictaphoneConsentPage() {
  const [title, setTitle] = useState("Reunion sans titre");
  const [retention, setRetention] = useState("30");
  const [consentOral, setConsentOral] = useState(true);
  const [consentTranscript, setConsentTranscript] = useState(true);
  const [starting, setStarting] = useState(false);
  const router = useRouter();

  async function start() {
    setStarting(true);
    const res = await fetch("/api/meetings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, mode: "dictaphone", retentionDays: Number(retention) })
    });
    const meeting = await res.json();
    router.push(`/new/dictaphone/record?id=${meeting.id}`);
  }

  const canStart = consentOral && consentTranscript && title.trim().length > 0;

  return (
    <div className="page">
      <div className="top-actions">
        <Link href="/new">← Retour</Link>
      </div>

      <h1>Consentement</h1>
      <p className="secondary-text" style={{ marginBottom: 14 }}>Mode dictaphone</p>

      <div className="label">Titre de la reunion</div>
      <input className="input" style={{ marginBottom: 12 }} value={title} onChange={(e) => setTitle(e.target.value)} />

      <div className="card selectable" onClick={() => setConsentOral(!consentOral)}>
        {consentOral ? "✓" : "○"} Consentement oral recueilli aupres des participants presents
      </div>
      <div className="card selectable" onClick={() => setConsentTranscript(!consentTranscript)}>
        {consentTranscript ? "✓" : "○"} J&apos;autorise la transcription de cet enregistrement
      </div>

      <div className="row" style={{ marginTop: 10, marginBottom: 4 }}>
        <span className="secondary-text">Duree de conservation</span>
      </div>
      <select className="input" value={retention} onChange={(e) => setRetention(e.target.value)}>
        <option value="30">30 jours</option>
        <option value="90">90 jours</option>
        <option value="365">1 an</option>
      </select>

      <button className="btn btn-primary" disabled={!canStart || starting} onClick={start}>
        {starting ? "Preparation…" : "Demarrer l'enregistrement"}
      </button>
    </div>
  );
}
