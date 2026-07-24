import type { TranscriptSegment } from "./store";
import { mockTranscribe } from "./mock";

// Proxy vers le service FastAPI (ai-service/) qui centralise l'appel reel a
// Voxtral (Mistral). Node ne detient plus la cle MISTRAL_API_KEY ni la logique
// de mapping de la reponse : voir ai-service/clients/voxtral.py.
//
// Ce fallback local sur le mock est un second filet de securite, independant
// de celui de FastAPI : il ne se declenche que si le service FastAPI lui-meme
// est injoignable (pas demarre, timeout reseau...), pas si Voxtral echoue
// (ce cas est deja gere cote FastAPI, qui retourne source:"mock").

const AI_SERVICE_URL = process.env.AI_SERVICE_URL ?? "http://localhost:8000";

export async function transcribeAudio(audioBuffer: Buffer, mimeType: string): Promise<{
  segments: TranscriptSegment[];
  source: "real" | "mock";
}> {
  try {
    const form = new FormData();
    form.append("file", new Blob([audioBuffer], { type: mimeType }), "recording.webm");
    form.append("mimeType", mimeType);

    const res = await fetch(`${AI_SERVICE_URL}/transcribe/dictaphone`, {
      method: "POST",
      body: form
    });
    if (!res.ok) throw new Error(`ai-service transcribe error: ${res.status}`);

    const json = await res.json();
    return { segments: json.segments, source: json.source };
  } catch (err) {
    console.error("[voxtral] ai-service unreachable, fallback to local mock:", err);
    return { segments: await mockTranscribe(), source: "mock" };
  }
}
