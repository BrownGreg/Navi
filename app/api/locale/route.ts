import { NextRequest, NextResponse } from "next/server";
import { LOCALE_COOKIE } from "@/lib/i18n";

export async function POST(req: NextRequest) {
  const { locale } = await req.json();
  if (locale !== "fr" && locale !== "en") {
    return NextResponse.json({ detail: "locale invalide" }, { status: 400 });
  }
  const res = NextResponse.json({ locale });
  res.cookies.set(LOCALE_COOKIE, locale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
  return res;
}
