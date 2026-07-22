import { NextResponse } from "next/server";
import { getMeetingById } from "@/lib/store";

export const runtime = "nodejs";

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const meeting = getMeetingById(params.id);
  if (!meeting) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  return NextResponse.json(meeting);
}
