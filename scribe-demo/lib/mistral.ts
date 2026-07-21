import type { TranscriptSegment, MeetingCR } from "./store";
import { mockGenerateCR } from "./mock";

// Integration best-effort avec l'API Chat Completions de Mistral (compatible OpenAI).
// Verifier le contrat exact sur https://docs.mistral.ai au moment de l'usage.
// Bascule automatique sur le mock si la cle est absente ou si l'appel echoue.

const MISTRAL_URL = "https://api.mistral.ai/v1/chat/completions";

export async function generateCR(transcript: TranscriptSegment[]): Promise<{
  cr: MeetingCR;
  source: "real" | "mock";
}> {
  const apiKey = process.env.MISTRAL_API_KEY;
  if (!apiKey) {
    return { cr: await mockGenerateCR(transcript), source: "mock" };
  }

  try {
    const transcriptText = transcript.map((s) => `${s.speaker}: ${s.text}`).join("\n");

    const res = await fetch(MISTRAL_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "mistral-small-latest",
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              "Tu structures des comptes-rendus de reunion en francais. Reponds uniquement en JSON avec les cles: resume (string), decisions (array de string), actions (array d'objets {text, owner}), themes (array de string)."
          },
          { role: "user", content: `Voici la transcription:\n\n${transcriptText}` }
        ]
      })
    });

    if (!res.ok) throw new Error(`Mistral API error: ${res.status}`);
    const json = await res.json();
    const content = json.choices?.[0]?.message?.content;
    if (!content) throw new Error("empty response from Mistral");

    const parsed = JSON.parse(content);
    const cr: MeetingCR = {
      resume: parsed.resume ?? "",
      decisions: parsed.decisions ?? [],
      actions: parsed.actions ?? [],
      themes: parsed.themes ?? []
    };

    return { cr, source: "real" };
  } catch (err) {
    console.error("[mistral] fallback to mock:", err);
    return { cr: await mockGenerateCR(transcript), source: "mock" };
  }
}
