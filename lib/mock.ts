import type { TranscriptSegment, MeetingCR } from "./store";

// Generateurs simules, utilises quand GLADIA_API_KEY / MISTRAL_API_KEY ne sont pas
// renseignees (ou si l'appel reel echoue). Le contenu est un exemple fixe : il ne
// reflete pas le contenu reel de l'enregistrement, ce qui est assume et annonce
// dans l'UI ("mode demo").

export async function mockTranscribe(): Promise<TranscriptSegment[]> {
  await wait(1200);
  return [
    { speaker: "Intervenant 1", text: "On peut demarrer, merci d'etre la.", start: 0 },
    { speaker: "Intervenant 2", text: "Cote avancement, le module de transcription est branche.", start: 6 },
    { speaker: "Intervenant 1", text: "Il reste a valider la generation du compte-rendu avant la demo.", start: 14 },
    { speaker: "Intervenant 2", text: "On peut viser vendredi pour la version stable.", start: 22 }
  ];
}

export async function mockGenerateCR(transcript: TranscriptSegment[]): Promise<MeetingCR> {
  await wait(900);
  return {
    resume:
      "Exemple genere en mode demo (sans cle API) : echange sur l'avancement du module de transcription et la planification de la version stable.",
    decisions: ["Cibler vendredi pour la version stable de la demo"],
    actions: [{ text: "Valider la generation du compte-rendu de bout en bout", owner: transcript[0]?.speaker ?? "A definir" }],
    themes: ["Avancement", "Planification"]
  };
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
