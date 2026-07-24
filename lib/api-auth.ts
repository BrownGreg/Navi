// lib/api-auth.ts
//
// Le middleware.ts protège les pages, pas les routes API (elles sont
// exclues du matcher). Ce helper protège explicitement les routes API
// existantes (/api/transcribe, /api/generate-cr, etc.) — DoD explicite
// du ticket : "API routes reject requests without a valid session/token".

import { NextRequest, NextResponse } from "next/server";
import { verifySession, SESSION_COOKIE_NAME, SessionPayload } from "@/lib/auth";

export async function requireAuth(
  req: NextRequest
): Promise<{ session: SessionPayload } | { error: NextResponse }> {
  const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = token ? await verifySession(token) : null;

  if (!session) {
    return {
      error: NextResponse.json({ error: "non authentifié" }, { status: 401 }),
    };
  }
  return { session };
}

// Usage dans une route existante, ex. app/api/generate-cr/route.ts :
//
// export async function POST(req: NextRequest) {
//   const auth = await requireAuth(req);
//   if ("error" in auth) return auth.error;
//   const { session } = auth; // session.userId dispo pour scoper la requête
//   ...
// }
