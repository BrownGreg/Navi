import { NextRequest, NextResponse } from "next/server";
import { updateMeeting } from "@/lib/store";
import { transcribeAudio } from "@/lib/voxtral";
import { moderateTranscript } from "@/lib/moderation";
import { requireAuth } from "@/lib/api-auth";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request);
  if ("error" in auth) return auth.error;

  const form = await request.formData();
  const meetingId = form.get("meetingId");
  const audio = form.get("audio");
  const durationSec = Number(form.get("durationSec") ?? 0);

  if (typeof meetingId !== "string" || !audio || !(audio instanceof Blob)) {
    return NextResponse.json({ error: "meetingId et audio requis" }, { status: 400 });
  }

  const arrayBuffer = await audio.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const mimeType = audio.type || "audio/webm";

  const { segments, source } = await transcribeAudio(buffer, mimeType);
  const moderation = await moderateTranscript(segments);

  const updated = updateMeeting(meetingId, {
    transcript: segments,
    durationMin: Math.max(1, Math.round(durationSec / 60)),
    source,
    moderation
  });

  if (!updated) {
    return NextResponse.json({ error: "reunion introuvable" }, { status: 404 });
  }

  return NextResponse.json({ segments, source, moderation });
}
