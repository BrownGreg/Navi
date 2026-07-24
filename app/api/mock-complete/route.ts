import { NextRequest, NextResponse } from "next/server";
import { updateMeeting } from "@/lib/store";
import { mockTranscribe, mockGenerateCR } from "@/lib/mock";
import { requireAuth } from "@/lib/api-auth";

export const runtime = "nodejs";

// Utilise par le mockup visio (non fonctionnel) pour simuler une fin de reunion
// et alimenter un CR de demonstration, sans passer par un vrai enregistrement audio.
export async function POST(request: NextRequest) {
  const auth = await requireAuth(request);
  if ("error" in auth) return auth.error;

  const { meetingId, durationMin } = await request.json();
  const segments = await mockTranscribe();
  const { resume, decisions, actions, themes } = await mockGenerateCR(segments);

  const updated = updateMeeting(meetingId, {
    transcript: segments,
    cr: { resume, decisions, actions, themes },
    status: "ready",
    durationMin: durationMin ?? 12,
    source: "mock"
  });

  if (!updated) {
    return NextResponse.json({ error: "reunion introuvable" }, { status: 404 });
  }
  return NextResponse.json(updated);
}
