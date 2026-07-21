"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function VisioConsentPage() {
  const [title, setTitle] = useState("Reunion sans titre");
  const [retention, setRetention] = useState("30");
  const [starting, setStarting] = useState(false);
  const router = useRouter();

  async function join() {
    setStarting(true);
    const res = await fetch("/api/meetings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, mode: "visio", retentionDays: Number(retention) })
    });
    const meeting = await res.json();
    router.push(`/new/visio/live?id=${meeting.id}`);
  }

  return (
    <div className="page">
      <div className="top-actions">
        <Link href="/new">← Retour</Link>
      </div>

      <h1>Consentement</h1>
      <p className="secondary-text" style={{ marginBottom: 14 }}>Mode visio — mockup non fonctionnel</p>

      <div className="label">Titre de la reunion</div>
      <input className="input" style={{ marginBottom: 12 }} value={title} onChange={(e) => setTitle(e.target.value)} />

      <div className="card">✓ J&apos;autorise l&apos;enregistrement et la transcription de cette reunion</div>
      <div className="card">✓ Je consens au traitement IA (resume, classification)</div>
      <div className="card">✓ J&apos;accepte le partage avec les participants</div>

      <div className="row" style={{ marginTop: 10, marginBottom: 4 }}>
        <span className="secondary-text">Duree de conservation</span>
      </div>
      <select className="input" value={retention} onChange={(e) => setRetention(e.target.value)}>
        <option value="30">30 jours</option>
        <option value="90">90 jours</option>
        <option value="365">1 an</option>
      </select>

      <button className="btn btn-primary" disabled={starting} onClick={join}>
        {starting ? "Connexion…" : "Rejoindre la reunion"}
      </button>
    </div>
  );
}
