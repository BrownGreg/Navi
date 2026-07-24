import { NextRequest, NextResponse } from "next/server";
import { getMeetingById } from "@/lib/store";
import { requireAuth } from "@/lib/api-auth";

export const runtime = "nodejs";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(request);
  if ("error" in auth) return auth.error;

  const { id } = await params;
  const meeting = getMeetingById(id);
  if (!meeting) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  return NextResponse.json(meeting);
}