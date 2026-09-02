"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useI18n } from "@/lib/i18n/LocaleProvider";
import { format } from "@/lib/i18n";

function ParticipantConsentInner() {
  const params = useSearchParams();
  const meetingId = params.get("meetingId") ?? "";
  const { t } = useI18n();
  const p = t.participantConsent;

  const [note, setNote] = useState<string | null>(null);
  const [showDeclineForm, setShowDeclineForm] = useState(false);
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);

  function accept() {
    // Base legale : interet legitime de l'organisateur (contexte
    // professionnel), pas un consentement actif obligatoire par participant.
    // Ce clic ne declenche donc aucun appel API - seule l'information
    // prealable (cet ecran + le bot visible en reunion) doit etre reelle.
    setNote(p.acceptedNote);
  }

  async function decline() {
    if (!email.trim()) {
      setShowDeclineForm(true);
      return;
    }
    setSending(true);
    try {
      const res = await fetch("/api/rgpd-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), meetingId, type: "erasure" })
      });
      if (!res.ok) throw new Error("echec de la demande");
      setNote(p.declinedNote);
      setShowDeclineForm(false);
    } catch {
      setNote(p.errorNote);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="page page-narrow">
      <div className="top-actions">
        <Link href="/">{p.back}</Link>
      </div>

      <p className="muted" style={{ marginBottom: 10 }}>{p.notifNotice}</p>
      <div className="hatch" style={{ height: 70, borderRadius: "var(--radius)", marginBottom: 12 }} />

      <div className="card">
        <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 4 }}>{format(p.activatedBy, { name: "Sam" })}</div>
        <div className="secondary-text">{p.transcribedNotice}</div>
      </div>

      {!note ? (
        <>
          <button className="btn btn-primary" onClick={accept}>
            {p.accept}
          </button>
          <button className="btn" onClick={decline} disabled={sending}>
            {sending ? p.sending : p.decline}
          </button>

          {showDeclineForm ? (
            <div className="card" style={{ marginTop: 10 }}>
              <div className="secondary-text" style={{ marginBottom: 6 }}>{p.declineEmailNotice}</div>
              <input
                className="input"
                style={{ marginBottom: 8 }}
                placeholder={p.emailPlaceholder}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <button className="btn btn-primary" onClick={decline} disabled={sending || !email.trim()}>
                {sending ? p.sending : p.confirm}
              </button>
            </div>
          ) : null}
        </>
      ) : null}

      {note ? <p className="muted" style={{ marginTop: 10 }}>{note}</p> : null}

      <div style={{ marginTop: 20 }}>
        <Link href="/cr/shr-seed1" className="secondary-text">{p.exampleLink}</Link>
      </div>
      <p className="muted" style={{ marginTop: 10 }}>
        <Link href="/faq">{p.faqLink}</Link>
      </p>
    </div>
  );
}

export default function ParticipantConsentPage() {
  const { t } = useI18n();
  return (
    <Suspense fallback={<div className="page page-narrow">{t.common.loading}</div>}>
      <ParticipantConsentInner />
    </Suspense>
  );
}
