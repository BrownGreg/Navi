import Link from "next/link";
import { fetchAuthed } from "@/lib/server-api";
import type { Meeting } from "@/lib/types";
import { getLocale, getDictionary } from "@/lib/i18n/server";
import AppSidebar from "./AppSidebar";
import RailAvatar from "./RailAvatar";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const [res, locale] = await Promise.all([fetchAuthed("/meetings"), getLocale()]);
  const meetings: Meeting[] = res.ok ? await res.json() : [];
  const t = getDictionary(locale);

  return (
    <div className="app-shell">
      <aside className="app-rail">
        <Link href="/dashboard" title="Navi">
          <img src="/icon.png" alt="Navi" width={22} height={22} />
        </Link>
        <Link href="/dashboard" className="app-rail-icon" title={t.app.rail.reunions}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="9" />
            <path d="M12 7v5l3.5 2" />
          </svg>
        </Link>
        <Link href="/settings/calendar" className="app-rail-icon" title={t.app.rail.parametres}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="5" width="18" height="16" rx="2" />
            <path d="M3 10h18" />
            <path d="M8 3v4" />
            <path d="M16 3v4" />
          </svg>
        </Link>
        <RailAvatar />
      </aside>

      <AppSidebar meetings={meetings} />

      <main className="app-main">{children}</main>
    </div>
  );
}
