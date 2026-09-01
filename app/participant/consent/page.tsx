"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

function ParticipantConsentInner() {
  const params = useSearchParams();
  const meetingId = params.get("meetingId") ?? "";

  const [note, setNote] = useState<string | null>(null);
  const [showDeclineForm, setShowDeclineForm] = useState(false);
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);

  function accept() {
    // Base legale : interet legitime de l'organisateur (contexte
    // professionnel), pas un consentement actif obligatoire par participant.
    // Ce clic ne declenche donc aucun appel API - seule l'information
    // prealable (cet ecran + le bot visible en reunion) doit etre reelle.
    setNote("Merci, votre voix sera attribuee nominativement dans la transcription.");
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
      setNote(
        "Compris, votre demande a ete enregistree : vous apparaitrez comme 'Intervenant anonyme' " +
          "dans la transcription et recevrez une reponse sous 30 jours (art. 12 RGPD)."
      );
      setShowDeclineForm(false);
    } catch {
      setNote("Erreur lors de l'enregistrement de votre demande. Reessayez.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="page">
      <div className="top-actions">
        <Link href="/">← Retour</Link>
      </div>

      <p className="muted" style={{ marginBottom: 10 }}>Notification a l&apos;arrivee en reunion</p>
      <div className="hatch" style={{ height: 70, borderRadius: "var(--radius)", marginBottom: 12 }} />

      <div className="card">
        <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 4 }}>Sam a active l&apos;enregistrement</div>
        <div className="secondary-text">
          Cette reunion est transcrite par Navi. Votre voix et vos propos seront traites pour generer un compte-rendu.
        </div>
      </div>

      {!note ? (
        <>
          <button className="btn btn-primary" onClick={accept}>
            J&apos;accepte
          </button>
          <button className="btn" onClick={decline} disabled={sending}>
            {sending ? "Envoi…" : "Je ne consens pas"}
          </button>

          {showDeclineForm ? (
            <div className="card" style={{ marginTop: 10 }}>
              <div className="secondary-text" style={{ marginBottom: 6 }}>
                Un email est necessaire pour tracer et suivre votre demande.
              </div>
              <input
                className="input"
                style={{ marginBottom: 8 }}
                placeholder="prenom.nom@exemple.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <button className="btn btn-primary" onClick={decline} disabled={sending || !email.trim()}>
                {sending ? "Envoi…" : "Confirmer"}
              </button>
            </div>
          ) : null}
        </>
      ) : null}

      {note ? <p className="muted" style={{ marginTop: 10 }}>{note}</p> : null}

      <div style={{ marginTop: 20 }}>
        <Link href="/cr/shr-seed1" className="secondary-text">Voir un exemple de compte-rendu sans compte →</Link>
      </div>
      <p className="muted" style={{ marginTop: 10 }}>
        <Link href="/faq">Questions sur vos donnees ?</Link>
      </p>
    </div>
  );
}

export default function ParticipantConsentPage() {
  return (
    <Suspense fallback={<div className="page">Chargement…</div>}>
      <ParticipantConsentInner />
    </Suspense>
  );
}
