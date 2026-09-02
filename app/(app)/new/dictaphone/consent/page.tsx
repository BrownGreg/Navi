"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { apiFetch } from "@/lib/api-client";
import { useI18n } from "@/lib/i18n/LocaleProvider";
import { format } from "@/lib/i18n";

// Doit etre incrementee des que le texte des cases de consentement
// ci-dessous change (ex: "2026-08-29-v1" -> "2026-09-15-v2") : c'est ce qui
// rend consent_text_version tracable en base plutot qu'un placeholder fixe -
// sans ca, un consentement donne sous l'ancienne formulation serait
// indiscernable d'un consentement donne sous la nouvelle.
const CONSENT_TEXT_VERSION = "2026-08-29-v1";

export default function DictaphoneConsentPage() {
  const { t, locale } = useI18n();
  const d = t.app.dictaphoneConsent;
  const [title, setTitle] = useState(locale === "en" ? "Untitled meeting" : "Reunion sans titre");
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
      setError(d.error);
      setStarting(false);
    }
  }

  const canStart = consentOral && consentTranscript && title.trim().length > 0;

  return (
    <div className="page page-narrow">
      <div className="top-actions">
        <Link href="/new">{d.back}</Link>
      </div>

      <h1>{d.h1}</h1>
      <p className="secondary-text" style={{ marginBottom: 14 }}>{format(d.sub, { days: retention })}</p>

      <div className="label">{d.titleLabel}</div>
      <input className="input" style={{ marginBottom: 12 }} value={title} onChange={(e) => setTitle(e.target.value)} />

      <div className="card selectable" onClick={() => setConsentOral(!consentOral)}>
        {consentOral ? "✓" : "○"} {d.consentOral}
      </div>
      <div className="card selectable" onClick={() => setConsentTranscript(!consentTranscript)}>
        {consentTranscript ? "✓" : "○"} {d.consentTranscript}
      </div>

      <div className="row" style={{ marginTop: 10, marginBottom: 4 }}>
        <span className="secondary-text">{d.retentionLabel}</span>
      </div>
      <select className="input" value={retention} onChange={(e) => setRetention(e.target.value)}>
        <option value="30">{d.retention30}</option>
        <option value="90">{d.retention90}</option>
        <option value="365">{d.retention365}</option>
      </select>

      {error ? (
        <div className="card" style={{ color: "var(--danger)", marginTop: 12 }}>{error}</div>
      ) : null}

      <button className="btn btn-primary btn-block" disabled={!canStart || starting} onClick={start}>
        {starting ? d.submitting : d.submit}
      </button>

      <p className="muted" style={{ marginTop: 12 }}>
        {d.rgpdLine} <Link href="/rgpd">{d.rgpdLink}</Link>
      </p>
    </div>
  );
}
