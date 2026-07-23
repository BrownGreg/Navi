// DEPRECIE — conserve pour historique uniquement, plus importe nulle part.
// La stack a bascule de Gladia vers Voxtral (Mistral) en juillet 2026.
// Voir lib/voxtral.ts pour l'integration active.

import type { TranscriptSegment } from "./store";
import { mockTranscribe } from "./mock";

// Integration best-effort avec l'API v2 de Gladia (upload -> pre-recorded -> poll).
// Verifier le contrat exact sur https://docs.gladia.io au moment de l'usage : les
// APIs tierces evoluent, et cette route bascule automatiquement sur le mock si
// un appel echoue, pour ne jamais casser la demo.

const GLADIA_BASE = "https://api.gladia.io/v2";

export async function transcribeAudio(audioBuffer: Buffer, mimeType: string): Promise<{
  segments: TranscriptSegment[];
  source: "real" | "mock";
}> {
  const apiKey = process.env.GLADIA_API_KEY;
  if (!apiKey) {
    return { segments: await mockTranscribe(), source: "mock" };
  }

  try {
    const uploadForm = new FormData();
    uploadForm.append("audio", new Blob([audioBuffer], { type: mimeType }), "recording.webm");

    const uploadRes = await fetch(`${GLADIA_BASE}/upload`, {
      method: "POST",
      headers: { "x-gladia-key": apiKey },
      body: uploadForm
    });
    if (!uploadRes.ok) throw new Error(`upload failed: ${uploadRes.status}`);
    const uploadJson = await uploadRes.json();
    const audioUrl = uploadJson.audio_url;
    if (!audioUrl) throw new Error("no audio_url returned by Gladia upload");

    const jobRes = await fetch(`${GLADIA_BASE}/pre-recorded`, {
      method: "POST",
      headers: { "x-gladia-key": apiKey, "Content-Type": "application/json" },
      body: JSON.stringify({ audio_url: audioUrl, diarization: true })
    });
    if (!jobRes.ok) throw new Error(`job creation failed: ${jobRes.status}`);
    const jobJson = await jobRes.json();
    const resultUrl: string = jobJson.result_url;
    if (!resultUrl) throw new Error("no result_url returned by Gladia");

    const result = await pollResult(resultUrl, apiKey);
    const utterances = result?.result?.transcription?.utterances ?? [];
    if (!Array.isArray(utterances) || utterances.length === 0) {
      throw new Error("empty transcription from Gladia");
    }

    const segments: TranscriptSegment[] = utterances.map((u: any) => ({
      speaker: `Intervenant ${(u.speaker ?? 0) + 1}`,
      text: u.text ?? "",
      start: u.start ?? 0
    }));

    return { segments, source: "real" };
  } catch (err) {
    console.error("[gladia] fallback to mock:", err);
    return { segments: await mockTranscribe(), source: "mock" };
  }
}

async function pollResult(resultUrl: string, apiKey: string, attempts = 15, delayMs = 2000): Promise<any> {
  for (let i = 0; i < attempts; i++) {
    const res = await fetch(resultUrl, { headers: { "x-gladia-key": apiKey } });
    if (res.ok) {
      const json = await res.json();
      if (json.status === "done") return json;
      if (json.status === "error") throw new Error("Gladia job errored");
    }
    await new Promise((r) => setTimeout(r, delayMs));
  }
  throw new Error("Gladia polling timed out");
}
