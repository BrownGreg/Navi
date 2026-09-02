import fr from "./fr";
import en from "./en";

export type Locale = "fr" | "en";
export type Dictionary = typeof fr;

export const LOCALE_COOKIE = "navi_locale";
export const LOCALES: Locale[] = ["fr", "en"];

const dictionaries: Record<Locale, Dictionary> = { fr, en };

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale];
}

// Formatte une date dans la locale active : les pages qui affichaient des
// dates en "fr-FR" en dur doivent passer par ici pour eviter des dates en
// francais sur une interface par ailleurs traduite en anglais.
export function localeTag(locale: Locale): string {
  return locale === "en" ? "en-US" : "fr-FR";
}

// Substitution basique {placeholder} -> valeur, pour les chaines du
// dictionnaire qui contiennent des variables (ex: "{email}", "{days}").
export function format(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (match, key) => (key in vars ? String(vars[key]) : match));
}

// getLocale() (qui lit le cookie via next/headers) vit dans ./server —
// volontairement absent d'ici : ce fichier est importe par des composants
// client (ex: LanguageSwitcher, CrView), et next/headers casse la
// compilation des qu'il est atteignable depuis un module cote client, meme
// via une fonction jamais appelee.
