"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useI18n } from "@/lib/i18n/LocaleProvider";
import { format } from "@/lib/i18n";

type RgpdType = "access" | "rectification" | "erasure";

function RgpdRequestInner() {
  const params = useSearchParams();
  const meetingId = params.get("meetingId") ?? "";
  const { t } = useI18n();
  const r = t.rgpdRequest;

  const TYPES: { value: RgpdType; label: string }[] = [
    { value: "access", label: r.types.access },
    { value: "rectification", label: r.types.rectification },
    { value: "erasure", label: r.types.erasure },
  ];

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
        <h1>{r.sentH1}</h1>
        <p className="secondary-text">{format(r.sentBody, { email })}</p>
        <Link href="/"><button className="btn">{r.backHome}</button></Link>
      </div>
    );
  }

  return (
    <div className="page page-narrow">
      <h1>{r.h1}</h1>
      <p className="secondary-text" style={{ marginBottom: 12 }}>{r.sub}</p>

      <div className="label">{r.emailLabel}</div>
      <input
        className="input"
        style={{ marginBottom: 10 }}
        placeholder={r.emailPlaceholder}
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <div className="label">{r.meetingLabel}</div>
      <div className="card">{meetingId || r.notSpecified}</div>

      <div className="label">{r.typeLabel}</div>
      {TYPES.map((tp) => (
        <div key={tp.value} className="card selectable" onClick={() => toggleType(tp.value)}>
          {selectedTypes.has(tp.value) ? "✓" : "○"} {tp.label}
        </div>
      ))}

      <button
        className="btn btn-primary btn-block"
        disabled={!email || selectedTypes.size === 0 || sending}
        onClick={submit}
      >
        {sending ? r.sending : selectedTypes.size > 1 ? r.submitMany : r.submitOne}
      </button>
    </div>
  );
}

export default function RgpdRequestPage() {
  const { t } = useI18n();
  return (
    <Suspense fallback={<div className="page page-narrow">{t.common.loading}</div>}>
      <RgpdRequestInner />
    </Suspense>
  );
}
