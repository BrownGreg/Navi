// app/api/auth/signin/route.ts

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/password";
import { signSession, SESSION_COOKIE_NAME } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const email = body?.email?.trim().toLowerCase();
  const password = body?.password;

  if (!email || !password) {
    return NextResponse.json(
      { error: "email et password requis" },
      { status: 400 }
    );
  }

  const user = await prisma.user.findUnique({ where: { email } });
  // Message d'erreur volontairement identique dans les deux cas
  // (email inconnu vs mot de passe faux) pour ne pas révéler si un
  // email existe en base.
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return NextResponse.json(
      { error: "identifiants invalides" },
      { status: 401 }
    );
  }

  const token = await signSession({ userId: user.id, email: user.email });

  const res = NextResponse.json({ id: user.id, email: user.email });
  res.cookies.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return res;
}
