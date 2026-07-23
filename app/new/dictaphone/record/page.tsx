"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

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

  const [seconds, setSeconds] = useState(0);
  const [sizeKb, setSizeKb] = useState(0);
  const [recording, setRecording] = useState(false);
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
          setError(
            "Acces au microphone refuse ou indisponible. Autorisez le micro dans votre navigateur puis rechargez la page."
          );
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

    await fetch("/api/transcribe", { method: "POST", body: form });
    router.push(`/new/dictaphone/processing?id=${meetingId}`);
  }

  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");

  return (
    <div className="page">
      <h1>Reunion en cours</h1>
      <p className="secondary-text" style={{ marginBottom: 14 }}>Mode dictaphone</p>

      {error ? (
        <div className="card" style={{ color: "var(--danger)" }}>{error}</div>
      ) : (
        <>
          <div className="row" style={{ marginBottom: 10 }}>
            <span className="pill rec">● REC {mm}:{ss}</span>
            <span className="muted">{Math.round(sizeKb)} Ko</span>
          </div>
          <div className="hatch" style={{ height: 80, borderRadius: "var(--radius)", marginBottom: 10 }} />
          <div className="row">
            <span className="secondary-text">Reseau</span>
            <span className="pill">Buffer local actif</span>
          </div>
        </>
      )}

      <button className="btn btn-primary" disabled={!recording || finishing} onClick={stopAndProcess}>
        {finishing ? "Envoi et transcription…" : "Terminer la reunion"}
      </button>
    </div>
  );
}

export default function RecordPage() {
  return (
    <Suspense fallback={<div className="page">Chargement…</div>}>
      <RecordInner />
    </Suspense>
  );
}
