// app/api/auth/signup/route.ts

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma"; // client Prisma existant du projet
import { hashPassword } from "@/lib/password";
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
  if (password.length < 8) {
    return NextResponse.json(
      { error: "le mot de passe doit faire au moins 8 caractères" },
      { status: 400 }
    );
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json(
      { error: "un compte existe déjà avec cet email" },
      { status: 409 }
    );
  }

  const passwordHash = await hashPassword(password);
  const user = await prisma.user.create({
    data: { email, passwordHash },
  });

  const token = await signSession({ userId: user.id, email: user.email });

  const res = NextResponse.json({ id: user.id, email: user.email });
  res.cookies.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 jours, doit rester cohérent avec lib/auth.ts
  });
  return res;
}
