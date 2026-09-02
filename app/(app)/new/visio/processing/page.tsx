"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { apiFetch } from "@/lib/api-client";
import { useI18n } from "@/lib/i18n/LocaleProvider";

function ProcessingInner() {
  const params = useSearchParams();
  const router = useRouter();
  const meetingId = params.get("id") ?? "";
  const { t } = useI18n();
  const p = t.app.processing;
  const [crDone, setCrDone] = useState(false);
  const [source, setSource] = useState<"real" | "mock" | null>(null);
  const requestedRef = useRef<string | null>(null);

  useEffect(() => {
    if (!meetingId) return;
    // Meme garde que app/new/dictaphone/processing/page.tsx : evite le
    // double appel a /api/generate-cr sous React 18 Strict Mode (dev).
    if (requestedRef.current === meetingId) return;
    requestedRef.current = meetingId;

    apiFetch("/api/generate-cr", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ meetingId })
    })
      .then((r) => r.json())
      .then((data) => {
        setSource(data.source);
        setCrDone(true);
      });
  }, [meetingId]);

  return (
    <div className="page page-narrow">
      <h1>{p.title}</h1>
      <p className="secondary-text" style={{ marginBottom: 14 }}>{p.sub}</p>

      <div className="card">{p.stepTranscriptVexa}</div>
      <div className="card">{p.stepModeration}</div>
      <div className="card" style={{ color: crDone ? "inherit" : "var(--text-secondary)" }}>
        {crDone ? p.stepCrDone : p.stepCrPending}
        {source ? <span className="pill" style={{ marginLeft: 8 }}>{source === "real" ? p.sourceReal : p.sourceMock}</span> : null}
      </div>

      <button className="btn btn-primary btn-block" disabled={!crDone} onClick={() => router.push(`/reunion/${meetingId}`)}>
        {p.viewCr}
      </button>
    </div>
  );
}

export default function VisioProcessingPage() {
  const { t } = useI18n();
  return (
    <Suspense fallback={<div className="page page-narrow">{t.common.loading}</div>}>
      <ProcessingInner />
    </Suspense>
  );
}
