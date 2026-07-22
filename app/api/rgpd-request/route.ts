import { NextResponse } from "next/server";
import { saveRgpdRequest } from "@/lib/store";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = await request.json();
  const { email, meetingId, type } = body;

  if (!email || !meetingId || !type) {
    return NextResponse.json({ error: "email, meetingId et type requis" }, { status: 400 });
  }

  const saved = saveRgpdRequest({ email, meetingId, type });
  return NextResponse.json(saved);
}
