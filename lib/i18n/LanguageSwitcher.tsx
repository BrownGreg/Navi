"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useI18n } from "./LocaleProvider";
import type { Locale } from "./index";

export function LanguageSwitcher({ style }: { style?: React.CSSProperties }) {
  const { locale } = useI18n();
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function switchTo(next: Locale) {
    if (next === locale || pending) return;
    setPending(true);
    await fetch("/api/locale", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ locale: next }),
    });
    router.refresh();
    setPending(false);
  }

  return (
    <div className="seg" style={{ fontSize: 11, ...style }}>
      <button
        type="button"
        className="seg-opt"
        style={{ color: locale === "fr" ? "var(--color-accent)" : "var(--color-neutral-500)", boxShadow: locale === "fr" ? "inset 0 0 0 1px var(--color-accent)" : "none" }}
        onClick={() => switchTo("fr")}
      >
        FR
      </button>
      <button
        type="button"
        className="seg-opt"
        style={{ color: locale === "en" ? "var(--color-accent)" : "var(--color-neutral-500)", boxShadow: locale === "en" ? "inset 0 0 0 1px var(--color-accent)" : "none" }}
        onClick={() => switchTo("en")}
      >
        EN
      </button>
    </div>
  );
}
