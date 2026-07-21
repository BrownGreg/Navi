import { NextResponse } from "next/server";
import { getMeetingById, updateMeeting } from "@/lib/store";
import { generateCR } from "@/lib/mistral";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = await request.json();
  const meetingId: string = body.meetingId;

  const meeting = getMeetingById(meetingId);
  if (!meeting || !meeting.transcript) {
    return NextResponse.json({ error: "reunion ou transcription introuvable" }, { status: 404 });
  }

  const { cr, source } = await generateCR(meeting.transcript);

  const updated = updateMeeting(meetingId, {
    cr,
    status: "ready",
    source: source === "real" || meeting.source === "real" ? source : "mock"
  });

  return NextResponse.json({ cr, source, meeting: updated });
}
