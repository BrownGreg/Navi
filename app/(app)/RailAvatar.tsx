"use client";

import { useRouter } from "next/navigation";
import { useI18n } from "@/lib/i18n/LocaleProvider";

export default function RailAvatar() {
  const router = useRouter();
  const { t } = useI18n();

  async function signOut() {
    await fetch("/api/auth/signout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  return (
    <button className="app-rail-avatar" onClick={signOut} title={t.app.rail.signOut} aria-label={t.app.rail.signOut}>
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
        <path d="M16 17l5-5-5-5" />
        <path d="M21 12H9" />
      </svg>
    </button>
  );
}
