// middleware.ts (racine du repo, à côté de package.json)
//
// Protège les pages (pas les routes API — voir lib/api-auth.ts pour ça).
// Redirige vers /sign-in si le cookie de session est absent ou invalide.

import { NextRequest, NextResponse } from "next/server";
import { verifySession, SESSION_COOKIE_NAME } from "@/lib/auth";

// Pages accessibles sans être connecté
const PUBLIC_PATHS = ["/sign-in", "/sign-up"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p));
  if (isPublic) {
    return NextResponse.next();
  }

  const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = token ? await verifySession(token) : null;

  if (!session) {
    const signInUrl = new URL("/sign-in", req.url);
    signInUrl.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
}

// Applique le middleware à toutes les pages sauf les assets statiques,
// les routes API (protégées séparément) et les fichiers Next internes.
export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
