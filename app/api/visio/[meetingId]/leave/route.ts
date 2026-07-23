import { NextResponse } from "next/server";
import { getMeetingById, updateMeeting } from "@/lib/store";
import { leaveVisioMeeting } from "@/lib/vexa";
import { moderateTranscript } from "@/lib/moderation";

export const runtime = "nodejs";

export async function POST(request: Request, { params }: { params: Promise<{ meetingId: string }> }) {
  const { meetingId } = await params;
  const meeting = getMeetingById(meetingId);
  if (!meeting || !meeting.platform || !meeting.nativeMeetingId) {
    return NextResponse.json({ error: "reunion visio introuvable" }, { status: 404 });
  }

  const body = await request.json().catch(() => ({}));
  const durationMin: number = body.durationMin ?? Math.max(1, meeting.durationMin);

  const { segments, source } = await leaveVisioMeeting({
    platform: meeting.platform,
    nativeMeetingId: meeting.nativeMeetingId
  });
  const moderation = await moderateTranscript(segments);

  const updated = updateMeeting(meeting.id, {
    transcript: segments,
    durationMin,
    source,
    moderation
  });

  return NextResponse.json({ segments, source, moderation, meeting: updated });
}
