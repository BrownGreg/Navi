import { cookies } from "next/headers";
import { LOCALE_COOKIE, type Locale } from "./index";

export { getDictionary, localeTag, format, LOCALES, LOCALE_COOKIE } from "./index";
export type { Locale, Dictionary } from "./index";

// Aucun prefixe d'URL par locale (pas de /en/..., /fr/...) : une contrainte
// deja rencontree avec le groupe de routes (app) (voir ai-service/routers/
// calendar.py qui redirige en dur vers /settings/calendar) — changer la
// structure d'URL casserait ce redirect OAuth. La langue vient donc d'un
// simple cookie, pose par app/api/locale/route.ts. Server-only (next/headers) :
// a n'importer que depuis un Server Component ou une Route Handler.
export async function getLocale(): Promise<Locale> {
  const cookieStore = await cookies();
  const value = cookieStore.get(LOCALE_COOKIE)?.value;
  return value === "en" ? "en" : "fr";
}
