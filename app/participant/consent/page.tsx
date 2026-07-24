"use client";

import { useState } from "react";
import Link from "next/link";
import { MOCK_RECORDER_NAME, MOCK_SHARED_CR_ID } from "@/fixtures/participant-consent";

export default function ParticipantConsentPage() {
  const [note, setNote] = useState<string | null>(null);

  return (
    <div className="page">
      <div className="top-actions">
        <Link href="/">← Retour</Link>
      </div>

      <p className="muted" style={{ marginBottom: 10 }}>Notification a l&apos;arrivee en reunion</p>
      <div className="hatch" style={{ height: 70, borderRadius: "var(--radius)", marginBottom: 12 }} />

      <div className="card">
        <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 4 }}>{MOCK_RECORDER_NAME} a active l&apos;enregistrement</div>
        <div className="secondary-text">
          Cette reunion est transcrite par Scribe. Votre voix et vos propos seront traites pour generer un compte-rendu.
        </div>
      </div>

      <button className="btn btn-primary" onClick={() => setNote("Merci, votre voix sera attribuee nominativement dans la transcription.")}>
        J&apos;accepte
      </button>
      <button className="btn" onClick={() => setNote("Compris, vous apparaitrez comme 'Intervenant anonyme' dans la transcription.")}>
        Je ne consens pas
      </button>

      {note ? <p className="muted" style={{ marginTop: 10 }}>{note}</p> : null}

      <div style={{ marginTop: 20 }}>
        <Link href={`/cr/${MOCK_SHARED_CR_ID}`} className="secondary-text">Voir un exemple de compte-rendu sans compte →</Link>
      </div>
    </div>
  );
}
