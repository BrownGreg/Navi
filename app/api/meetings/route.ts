import { NextRequest, NextResponse } from "next/server";
import { createMeeting, getAllMeetings } from "@/lib/store";
import { requireAuth } from "@/lib/api-auth";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if ("error" in auth) return auth.error;
  // TODO(P2-07/P2-05): getAllMeetings() renvoie encore les reunions de tout
  // le monde, pas seulement celles de auth.session.userId — le store JSON
  // (lib/store.ts) n'a pas de notion de proprietaire. A corriger avec la
  // migration vers Prisma (P2-05), qui ajoutera Meeting.userId.
  return NextResponse.json(getAllMeetings());
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request);
  if ("error" in auth) return auth.error;

  const body = await request.json();
  const title: string = body.title?.trim() || "Reunion sans titre";
  const mode: "visio" | "dictaphone" = body.mode === "visio" ? "visio" : "dictaphone";
  const retentionDays: number = Number(body.retentionDays) || 30;

  const meeting = createMeeting({ title, mode, retentionDays });
  return NextResponse.json(meeting);
}
