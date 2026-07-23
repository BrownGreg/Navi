"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const PLATFORMS = [
  { value: "google_meet", label: "Google Meet", hint: "code de reunion, ex: abc-defg-hij" },
  { value: "teams", label: "Microsoft Teams", hint: "identifiant ou lien d'invitation" },
  { value: "zoom", label: "Zoom", hint: "identifiant numerique de la reunion" }
] as const;

export default function VisioConsentPage() {
  const [title, setTitle] = useState("Reunion sans titre");
  const [retention, setRetention] = useState("30");
  const [platform, setPlatform] = useState<(typeof PLATFORMS)[number]["value"]>("google_meet");
  const [nativeMeetingId, setNativeMeetingId] = useState("");
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function join() {
    setError(null);
    setStarting(true);
    try {
      const meetingRes = await fetch("/api/meetings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, mode: "visio", retentionDays: Number(retention) })
      });
      const meeting = await meetingRes.json();

      const joinRes = await fetch("/api/visio/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ meetingId: meeting.id, platform, nativeMeetingId: nativeMeetingId.trim() })
      });
      if (!joinRes.ok) throw new Error("echec du join");

      router.push(`/new/visio/live?id=${meeting.id}`);
    } catch (err) {
      setError("Impossible de rejoindre la reunion. Verifiez l'identifiant et reessayez.");
      setStarting(false);
    }
  }

  const canJoin = nativeMeetingId.trim().length > 0;

  return (
    <div className="page">
      <div className="top-actions">
        <Link href="/new">← Retour</Link>
      </div>

      <h1>Consentement</h1>
      <p className="secondary-text" style={{ marginBottom: 14 }}>
        Mode visio — un bot Vexa rejoint la reunion pour transcrire et diariser en direct
      </p>

      <div className="label">Titre de la reunion</div>
      <input className="input" style={{ marginBottom: 12 }} value={title} onChange={(e) => setTitle(e.target.value)} />

      <div className="label">Plateforme</div>
      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        {PLATFORMS.map((p) => (
          <div
            key={p.value}
            className={`card selectable ${platform === p.value ? "selected" : ""}`}
            style={{ flex: 1, textAlign: "center", padding: 10 }}
            onClick={() => setPlatform(p.value)}
          >
            {p.label}
          </div>
        ))}
      </div>

      <div className="label">Identifiant ou lien de la reunion</div>
      <input
        className="input"
        style={{ marginBottom: 4 }}
        placeholder={PLATFORMS.find((p) => p.value === platform)?.hint}
        value={nativeMeetingId}
        onChange={(e) => setNativeMeetingId(e.target.value)}
      />
      <p className="muted" style={{ marginBottom: 12 }}>
        Format exact selon la plateforme — voir le guide de test dans le README avant un premier essai.
      </p>

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

      {error ? (
        <div className="card" style={{ color: "var(--danger)", marginTop: 12 }}>{error}</div>
      ) : null}

      <button className="btn btn-primary" disabled={!canJoin || starting} onClick={join}>
        {starting ? "Connexion du bot…" : "Rejoindre la reunion"}
      </button>
    </div>
  );
}
