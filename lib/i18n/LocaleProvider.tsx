"use client";

import { createContext, useContext } from "react";
import type { Dictionary, Locale } from "./index";

type Ctx = { locale: Locale; t: Dictionary };

const LocaleContext = createContext<Ctx | null>(null);

// Pose au niveau du layout racine (server component, valeurs lues depuis le
// cookie navi_locale) pour que n'importe quel composant client de
// l'arborescence (AppSidebar, CrView, formulaires...) accede a la langue
// active sans avoir a la faire descendre manuellement de composant en
// composant.
export function LocaleProvider({ locale, t, children }: Ctx & { children: React.ReactNode }) {
  return <LocaleContext.Provider value={{ locale, t }}>{children}</LocaleContext.Provider>;
}

export function useI18n(): Ctx {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error("useI18n() doit etre utilise sous <LocaleProvider>");
  return ctx;
}
