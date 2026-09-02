"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { apiFetch } from "@/lib/api-client";
import { useI18n } from "@/lib/i18n/LocaleProvider";
import { format } from "@/lib/i18n";

const AUDIO_MIME_CANDIDATES = [
  "audio/webm;codecs=opus",
  "audio/webm",
  "audio/ogg;codecs=opus",
  "audio/mp4",
];

function pickSupportedMimeType(): string {
  if (typeof MediaRecorder === "undefined") return "";
  return AUDIO_MIME_CANDIDATES.find((type) => MediaRecorder.isTypeSupported(type)) ?? "";
}

function extensionForMimeType(mimeType: string): string {
  if (mimeType.includes("ogg")) return "ogg";
  if (mimeType.includes("mp4")) return "mp4";
  return "webm";
}

function RecordInner() {
  const params = useSearchParams();
  const router = useRouter();
  const meetingId = params.get("id") ?? "";
  const { t } = useI18n();
  const r = t.app.record;

  const [seconds, setSeconds] = useState(0);
  const [sizeKb, setSizeKb] = useState(0);
  const [recording, setRecording] = useState(false);
  const [paused, setPaused] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [finishing, setFinishing] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    // En dev, React 18 Strict Mode monte/demonte/remonte cet effet une fois
    // pour verifier l'idempotence. Sans le flag "cancelled" ci-dessous, les
    // deux invocations declenchent chacune leur propre getUserMedia/MediaRecorder,
    // et les deux ecrivent dans le meme chunksRef (reinitialise par la seconde
    // invocation) : c'est ce qui produisait un audio vide ou tronque en sortie.
    let cancelled = false;
    let localStream: MediaStream | null = null;

    async function startRecording() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        localStream = stream;
        streamRef.current = stream;

        const mimeType = pickSupportedMimeType();
        const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
        mediaRecorderRef.current = recorder;
        chunksRef.current = [];

        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) {
            chunksRef.current.push(e.data);
            setSizeKb((prev) => prev + e.data.size / 1024);
          }
        };

        recorder.start(1000);
        setRecording(true);
        timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
      } catch (err) {
        if (!cancelled) {
          setError(r.micError);
        }
      }
    }

    startRecording();

    return () => {
      cancelled = true;
      if (timerRef.current) clearInterval(timerRef.current);
      localStream?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  function togglePause() {
    const recorder = mediaRecorderRef.current;
    if (!recorder) return;
    if (recorder.state === "recording") {
      recorder.pause();
      if (timerRef.current) clearInterval(timerRef.current);
      setPaused(true);
    } else if (recorder.state === "paused") {
      recorder.resume();
      timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
      setPaused(false);
    }
  }

  async function stopAndProcess() {
    const recorder = mediaRecorderRef.current;
    if (!recorder) return;
    setFinishing(true);

    const stopped = new Promise<void>((resolve) => {
      recorder.onstop = () => resolve();
    });
    recorder.stop();
    if (timerRef.current) clearInterval(timerRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    await stopped;

    // Le type du Blob doit refleter le mimeType reellement negocie par le
    // MediaRecorder (recorder.mimeType) : lui coller un type different (ex.
    // "audio/webm" en dur alors que le navigateur a enregistre autre chose)
    // ne re-encode rien, ca ment juste sur le conteneur envoye a Voxtral, qui
    // echoue alors a le decoder.
    const mimeType = recorder.mimeType || "audio/webm";
    const blob = new Blob(chunksRef.current, { type: mimeType });
    // eslint-disable-next-line no-console
    console.log(`[dictaphone] blob pret pour upload: ${blob.size} octets, type=${mimeType}`);

    const form = new FormData();
    form.append("meetingId", meetingId);
    form.append("audio", blob, `recording.${extensionForMimeType(mimeType)}`);
    form.append("durationSec", String(seconds));

    await apiFetch("/api/transcribe", { method: "POST", body: form });
    router.push(`/new/dictaphone/processing?id=${meetingId}`);
  }

  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");

  return (
    <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", padding: 40 }}>
      <div style={{ width: 460, background: "var(--color-surface)", borderRadius: "var(--radius-lg)", boxShadow: "var(--shadow-sm)", padding: 30, display: "flex", flexDirection: "column", alignItems: "center", gap: 18 }}>
        {error ? (
          <p style={{ color: "var(--danger)", fontSize: 13, textAlign: "center" }}>{error}</p>
        ) : (
          <>
            <span style={{ fontSize: 12, color: "var(--color-neutral-500)" }}>
              {paused ? r.paused : r.recording} · {mm}:{ss}
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: 4, height: 52 }}>
              {[14, 26, 42, 20, 50, 16, 34, 24, 44, 12, 30].map((h, i) => (
                <span key={i} style={{ width: 3, height: h, borderRadius: 2, background: !paused && i >= 2 && i <= 4 ? "var(--accent)" : "var(--color-neutral-700)" }} />
              ))}
            </div>
            <span className="muted">{format(r.captured, { kb: Math.round(sizeKb) })}</span>
          </>
        )}

        <div style={{ display: "flex", gap: 10 }}>
          <button className="btn btn-secondary" disabled={!recording || finishing} onClick={togglePause}>
            {paused ? r.resume : r.pause}
          </button>
          <button className="btn btn-primary" disabled={!recording || finishing} onClick={stopAndProcess}>
            {finishing ? r.sending : r.finish}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function RecordPage() {
  const { t } = useI18n();
  return (
    <Suspense fallback={<div style={{ padding: 34 }}>{t.common.loading}</div>}>
      <RecordInner />
    </Suspense>
  );
}
