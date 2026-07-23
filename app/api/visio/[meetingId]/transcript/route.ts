import { NextResponse } from "next/server";
import { getMeetingById } from "@/lib/store";
import { getVisioTranscript } from "@/lib/vexa";

export const runtime = "nodejs";

export async function GET(_request: Request, { params }: { params: Promise<{ meetingId: string }> }) {
  const { meetingId } = await params;
  const meeting = getMeetingById(meetingId);
  if (!meeting || !meeting.platform || !meeting.nativeMeetingId) {
    return NextResponse.json({ error: "reunion visio introuvable" }, { status: 404 });
  }

  const result = await getVisioTranscript({
    platform: meeting.platform,
    nativeMeetingId: meeting.nativeMeetingId
  });

  return NextResponse.json(result);
}
