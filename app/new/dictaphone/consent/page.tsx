"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { apiFetch } from "@/lib/api-client";

// Doit etre incrementee des que le texte des cases de consentement
// ci-dessous change (ex: "2026-08-29-v1" -> "2026-09-15-v2") : c'est ce qui
// rend consent_text_version tracable en base plutot qu'un placeholder fixe -
// sans ca, un consentement donne sous l'ancienne formulation serait
// indiscernable d'un consentement donne sous la nouvelle.
const CONSENT_TEXT_VERSION = "2026-08-29-v1";

export default function DictaphoneConsentPage() {
  const [title, setTitle] = useState("Reunion sans titre");
  const [retention, setRetention] = useState("30");
  const [consentOral, setConsentOral] = useState(true);
  const [consentTranscript, setConsentTranscript] = useState(true);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function start() {
    setError(null);
    setStarting(true);
    try {
      const meetingRes = await apiFetch("/api/meetings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, mode: "dictaphone", retentionDays: Number(retention) })
      });
      const meeting = await meetingRes.json();

      // Le consentement est ecrit en base cote serveur AVANT de naviguer vers
      // l'enregistrement : /api/transcribe le revalide de toute facon (voir
      // ai-service/crud.require_consent), donc un echec ici doit bloquer la
      // suite plutot que de laisser l'utilisateur enregistrer pour rien.
      const consentRes = await apiFetch(`/api/meetings/${meeting.id}/consent`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          consentTypes: ["oral_recording", "transcript"],
          textVersion: CONSENT_TEXT_VERSION
        })
      });
      if (!consentRes.ok) throw new Error("echec de l'enregistrement du consentement");

      router.push(`/new/dictaphone/record?id=${meeting.id}`);
    } catch {
      setError("Impossible d'enregistrer votre consentement. Reessayez.");
      setStarting(false);
    }
  }

  const canStart = consentOral && consentTranscript && title.trim().length > 0;

  return (
    <div className="page">
      <div className="top-actions">
        <Link href="/new">← Retour</Link>
      </div>

      <h1>Consentement</h1>
      <p className="secondary-text" style={{ marginBottom: 14 }}>
        Mode dictaphone — l&apos;audio capte sera transcrit puis traite par IA (resume, classification)
        pour generer un compte-rendu, conserve {retention} jours puis supprime automatiquement.
      </p>

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

      {error ? (
        <div className="card" style={{ color: "var(--danger)", marginTop: 12 }}>{error}</div>
      ) : null}

      <button className="btn btn-primary" disabled={!canStart || starting} onClick={start}>
        {starting ? "Preparation…" : "Demarrer l'enregistrement"}
      </button>

      <p className="muted" style={{ marginTop: 12 }}>
        Droits RGPD des participants : <Link href="/rgpd">exercer mes droits</Link>
      </p>
    </div>
  );
}
