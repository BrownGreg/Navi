import { NextResponse } from "next/server";
import { getMeetingById, updateMeeting } from "@/lib/store";
import type { MeetingClassification } from "@/lib/store";

export const runtime = "nodejs";

/**
 * POST /api/classify
 * Body: { meetingId: string }
 *
 * Appelle l'IA pour classifier une reunion et stocke le résultat dans le store.
 * Si le service IA n'est pas disponible, génère une classification de démo.
 */
export async function POST(request: Request) {
  const body = await request.json();
  const meetingId: string = body.meetingId;

  const meeting = getMeetingById(meetingId);
  if (!meeting) {
    return NextResponse.json({ error: "reunion introuvable" }, { status: 404 });
  }
  if (meeting.status !== "ready" || !meeting.cr) {
    return NextResponse.json(
      { error: "la reunion doit etre terminee avec un CR pour etre classifiee" },
      { status: 400 }
    );
  }

  const aiServiceUrl = process.env.AI_SERVICE_URL;

  let classification: MeetingClassification;

  if (aiServiceUrl) {
    try {
      const res = await fetch(`${aiServiceUrl}/classify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ meeting_id: meetingId }),
      });
      if (!res.ok) {
        const text = await res.text();
        return NextResponse.json(
          { error: `service IA: ${text}` },
          { status: res.status }
        );
      }
      classification = await res.json();
    } catch {
      return NextResponse.json(
        { error: "service IA indisponible" },
        { status: 503 }
      );
    }
  } else {
    // Mode démonstration: dérive une classification depuis le CR existant
    const themes = meeting.cr.themes ?? [];
    classification = {
      ton: "neutre",
      urgence: "normale",
      themes,
      per_segment: meeting.transcript?.map((s) => ({
        speaker: s.speaker,
        theme: themes[0] ?? "General",
        ton: "neutre" as const,
      })),
    };
  }

  updateMeeting(meetingId, { classification });
  return NextResponse.json({ classification });
}
