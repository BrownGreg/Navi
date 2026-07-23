import type { TranscriptSegment, MeetingCR } from "./store";
import { mockGenerateCR } from "./mock";

// Proxy vers le service FastAPI (ai-service/) qui centralise l'appel reel a
// Kimi K3 (Moonshot AI). Node ne detient plus la cle MOONSHOT_API_KEY ni le
// prompt de structuration du CR : voir ai-service/clients/kimi.py (qui
// documente aussi la reserve de conformite RGPD/souverainete a trancher avant
// une mise en production).
//
// Ce fallback local sur le mock est un second filet de securite, independant
// de celui de FastAPI : il ne se declenche que si le service FastAPI lui-meme
// est injoignable, pas si Kimi K3 echoue (deja gere cote FastAPI).

const AI_SERVICE_URL = process.env.AI_SERVICE_URL ?? "http://localhost:8000";

export async function generateCR(transcript: TranscriptSegment[]): Promise<{
  cr: MeetingCR;
  source: "real" | "mock";
}> {
  try {
    const res = await fetch(`${AI_SERVICE_URL}/generate-cr`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ transcript })
    });
    if (!res.ok) throw new Error(`ai-service generate-cr error: ${res.status}`);

    const json = await res.json();
    return { cr: json.cr, source: json.source };
  } catch (err) {
    console.error("[kimi] ai-service unreachable, fallback to local mock:", err);
    return { cr: await mockGenerateCR(transcript), source: "mock" };
  }
}
