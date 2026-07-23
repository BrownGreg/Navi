// Proxy vers le service FastAPI (ai-service/) pour la moderation de la
// transcription via gpt-oss-safeguard-20b (servi ici par Groq, voir
// ai-service/clients/safeguard.py). Non bloquant par choix produit : cette
// fonction ne leve jamais, elle retombe sur "non signale" en cas d'echec, la
// generation du CR ne doit jamais dependre de la moderation.

import type { ModerationResult, TranscriptSegment } from "./store";

const AI_SERVICE_URL = process.env.AI_SERVICE_URL ?? "http://localhost:8000";

export async function moderateTranscript(transcript: TranscriptSegment[]): Promise<ModerationResult> {
  try {
    const res = await fetch(`${AI_SERVICE_URL}/moderate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ transcript })
    });
    if (!res.ok) throw new Error(`ai-service moderate error: ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error("[moderation] ai-service unreachable, skipping moderation:", err);
    return { flagged: false, source: "mock" };
  }
}
