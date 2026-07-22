import { NextResponse } from "next/server";
import { createMeeting, getAllMeetings } from "@/lib/store";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json(getAllMeetings());
}

export async function POST(request: Request) {
  const body = await request.json();
  const title: string = body.title?.trim() || "Reunion sans titre";
  const mode: "visio" | "dictaphone" = body.mode === "visio" ? "visio" : "dictaphone";
  const retentionDays: number = Number(body.retentionDays) || 30;

  const meeting = createMeeting({ title, mode, retentionDays });
  return NextResponse.json(meeting);
}
