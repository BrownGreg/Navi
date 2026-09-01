"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

type RgpdType = "access" | "rectification" | "erasure";

const TYPES: { value: RgpdType; label: string }[] = [
  { value: "access", label: "Acces a mes donnees" },
  { value: "rectification", label: "Rectification" },
  { value: "erasure", label: "Suppression de ma voix et de mes propos" }
];

function RgpdRequestInner() {
  const params = useSearchParams();
  const meetingId = params.get("meetingId") ?? "";

  const [email, setEmail] = useState("");
  // Plusieurs demandes peuvent avoir du sens en meme temps (ex: acces a mes
  // donnees puis suppression) - cases a cocher plutot qu'un choix unique.
  const [selectedTypes, setSelectedTypes] = useState<Set<RgpdType>>(new Set(["erasure"]));
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);

  function toggleType(value: RgpdType) {
    setSelectedTypes((prev) => {
      const next = new Set(prev);
      if (next.has(value)) next.delete(value);
      else next.add(value);
      return next;
    });
  }

  async function submit() {
    setSending(true);
    // Le backend trace une demande = un type (cf. ai-service/routers/rgpd.py) :
    // une case cochee = un POST, pour garder chaque demande individuellement
    // tracee plutot que de redefinir le schema pour accepter un tableau.
    await Promise.all(
      Array.from(selectedTypes).map((type) =>
        fetch("/api/rgpd-request", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, meetingId, type })
        })
      )
    );
    setSending(false);
    setSent(true);
  }

  if (sent) {
    return (
      <div className="page page-narrow">
        <h1>Demande envoyee</h1>
        <p className="secondary-text">Vous recevrez une reponse a {email} sous 30 jours (art. 12 RGPD).</p>
        <Link href="/"><button className="btn">Retour a l&apos;accueil</button></Link>
      </div>
    );
  }

  return (
    <div className="page page-narrow">
      <h1>Exercer mes droits RGPD</h1>
      <p className="secondary-text" style={{ marginBottom: 12 }}>Traite sous 30 jours (art. 12 RGPD)</p>

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

      <div className="label">Type de demande (plusieurs choix possibles)</div>
      {TYPES.map((t) => (
        <div key={t.value} className="card selectable" onClick={() => toggleType(t.value)}>
          {selectedTypes.has(t.value) ? "✓" : "○"} {t.label}
        </div>
      ))}

      <button
        className="btn btn-primary btn-block"
        disabled={!email || selectedTypes.size === 0 || sending}
        onClick={submit}
      >
        {sending ? "Envoi…" : selectedTypes.size > 1 ? "Envoyer les demandes" : "Envoyer la demande"}
      </button>
    </div>
  );
}

export default function RgpdRequestPage() {
  return (
    <Suspense fallback={<div className="page page-narrow">Chargement…</div>}>
      <RgpdRequestInner />
    </Suspense>
  );
}
