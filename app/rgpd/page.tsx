"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

const TYPES: { value: "access" | "rectification" | "erasure"; label: string }[] = [
  { value: "access", label: "Acces a mes donnees" },
  { value: "rectification", label: "Rectification" },
  { value: "erasure", label: "Suppression de ma voix et de mes propos" }
];

function RgpdRequestInner() {
  const params = useSearchParams();
  const meetingId = params.get("meetingId") ?? "";

  const [email, setEmail] = useState("");
  const [type, setType] = useState<"access" | "rectification" | "erasure">("erasure");
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);

  async function submit() {
    setSending(true);
    await fetch("/api/rgpd-request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, meetingId, type })
    });
    setSending(false);
    setSent(true);
  }

  if (sent) {
    return (
      <div className="page">
        <h1>Demande envoyee</h1>
        <p className="secondary-text">Vous recevrez une reponse a {email} sous 30 jours (art. 28 RGPD).</p>
        <Link href="/"><button className="btn">Retour a l&apos;accueil</button></Link>
      </div>
    );
  }

  return (
    <div className="page">
      <h1>Exercer mes droits RGPD</h1>
      <p className="secondary-text" style={{ marginBottom: 12 }}>Traite sous 30 jours (art. 28 RGPD)</p>

      <div className="label">Votre email</div>
      <input
        className="input"
        style={{ marginBottom: 10 }}
        placeholder="prenom.nom@exemple.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <div className="label">Reunion concernee</div>
      <div className="card">{meetingId || "Non specifiee"}</div>

      <div className="label">Type de demande</div>
      {TYPES.map((t) => (
        <div key={t.value} className="card selectable" onClick={() => setType(t.value)}>
          {type === t.value ? "●" : "○"} {t.label}
        </div>
      ))}

      <button className="btn btn-primary" disabled={!email || sending} onClick={submit}>
        {sending ? "Envoi…" : "Envoyer la demande"}
      </button>
    </div>
  );
}

export default function RgpdRequestPage() {
  return (
    <Suspense fallback={<div className="page">Chargement…</div>}>
      <RgpdRequestInner />
    </Suspense>
  );
}
