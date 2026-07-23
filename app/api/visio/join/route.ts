import { NextResponse } from "next/server";
import { updateMeeting } from "@/lib/store";
import { joinVisioMeeting, type VisioPlatform } from "@/lib/vexa";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = await request.json();
  const meetingId: string = body.meetingId;
  const platform: VisioPlatform = body.platform;
  const nativeMeetingId: string = body.nativeMeetingId;

  if (!meetingId || !platform || !nativeMeetingId) {
    return NextResponse.json({ error: "meetingId, platform et nativeMeetingId requis" }, { status: 400 });
  }

  const { joined, source } = await joinVisioMeeting({ platform, nativeMeetingId });

  const updated = updateMeeting(meetingId, { platform, nativeMeetingId, source });
  if (!updated) {
    return NextResponse.json({ error: "reunion introuvable" }, { status: 404 });
  }

  return NextResponse.json({ joined, source, meeting: updated });
}
