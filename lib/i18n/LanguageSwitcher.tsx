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

  function itemStyle(active: boolean): React.CSSProperties {
    return {
      background: "none",
      border: "none",
      padding: 0,
      font: "inherit",
      fontSize: 11,
      letterSpacing: "0.03em",
      cursor: active ? "default" : "pointer",
      color: active ? "var(--color-accent)" : "var(--color-neutral-600)",
    };
  }

  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: 5, ...style }}>
      <button type="button" style={itemStyle(locale === "fr")} onClick={() => switchTo("fr")}>FR</button>
      <span style={{ fontSize: 11, color: "var(--color-neutral-800)" }}>/</span>
      <button type="button" style={itemStyle(locale === "en")} onClick={() => switchTo("en")}>EN</button>
    </div>
  );
}
