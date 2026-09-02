"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";
import type { Meeting } from "@/lib/types";
import { useI18n } from "@/lib/i18n/LocaleProvider";
import { localeTag } from "@/lib/i18n";
import { LanguageSwitcher } from "@/lib/i18n/LanguageSwitcher";

type Props = { meetings: Meeting[] };
type ModeFilter = "all" | "visio" | "dictaphone";

export default function AppSidebar({ meetings }: Props) {
  const pathname = usePathname();
  const { t, locale } = useI18n();
  const s = t.app.sidebar;
  const [modeFilter, setModeFilter] = useState<ModeFilter>("all");
  const [search, setSearch] = useState("");

  function dayLabel(iso: string): string {
    const d = new Date(iso);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    const sameDay = (a: Date, b: Date) =>
      a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
    if (sameDay(d, today)) return s.today;
    if (sameDay(d, yesterday)) return s.yesterday;
    return d.toLocaleDateString(localeTag(locale), { weekday: "long" });
  }

  const filtered = useMemo(() => {
    return meetings.filter((m) => {
      if (modeFilter !== "all" && m.mode !== modeFilter) return false;
      if (search.trim() && !m.title.toLowerCase().includes(search.trim().toLowerCase())) return false;
      return true;
    });
  }, [meetings, modeFilter, search]);

  const groups = useMemo(() => {
    const map = new Map<string, Meeting[]>();
    for (const m of filtered) {
      const label = dayLabel(m.date);
      if (!map.has(label)) map.set(label, []);
      map.get(label)!.push(m);
    }
    return Array.from(map.entries());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtered, locale]);

  return (
    <div className="app-sidebar">
      <div className="app-sidebar-top">
        <Link href="/new" className="btn btn-primary btn-block">{s.newMeeting}</Link>
        <input
          className="app-search"
          type="search"
          placeholder={s.search}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label={s.searchAria}
        />
      </div>

      <div className="app-tag-row">
        <button
          className={`tag ${modeFilter === "all" ? "tag-accent" : "tag-outline"}`}
          style={{ border: "none", background: modeFilter === "all" ? undefined : "transparent" }}
          onClick={() => setModeFilter("all")}
        >
          {s.filterAll}
        </button>
        <button
          className={`tag ${modeFilter === "visio" ? "tag-accent" : "tag-outline"}`}
          onClick={() => setModeFilter("visio")}
        >
          {s.filterVisio}
        </button>
        <button
          className={`tag ${modeFilter === "dictaphone" ? "tag-accent" : "tag-outline"}`}
          onClick={() => setModeFilter("dictaphone")}
        >
          {s.filterDictaphone}
        </button>
      </div>

      <div className="app-list">
        {groups.length === 0 ? (
          <div className="app-empty-list">{s.emptyList}</div>
        ) : (
          groups.map(([label, items]) => (
            <div key={label}>
              <div className="app-list-group-label">{label}</div>
              {items.map((m) => {
                const active = pathname === `/reunion/${m.id}`;
                const processing = m.status === "processing";
                return (
                  <Link key={m.id} href={`/reunion/${m.id}`} className={`app-row ${active ? "active" : ""}`}>
                    <div className="app-row-top">
                      <span className="app-row-title">{m.title}</span>
                      {processing ? (
                        <span className="app-row-live">
                          <span className="app-row-live-dot pulse" />
                          {s.live}
                        </span>
                      ) : (
                        <span className="app-row-meta">
                          {new Date(m.date).toLocaleTimeString(localeTag(locale), { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      )}
                    </div>
                    {processing ? (
                      <div className="app-row-progress"><span style={{ width: "40%" }} /></div>
                    ) : (
                      <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                        <span className={`tag ${m.mode === "visio" ? "tag-accent" : "tag-outline"}`} style={{ fontSize: 10 }}>
                          {m.mode === "visio" ? s.filterVisio : s.filterDictaphone}
                        </span>
                        <span className="app-row-meta">{m.durationMin} {s.minutes}</span>
                      </div>
                    )}
                  </Link>
                );
              })}
            </div>
          ))
        )}
      </div>

      <div style={{ marginTop: "auto", paddingTop: 10, borderTop: "1px solid var(--color-neutral-900)", display: "flex", justifyContent: "center" }}>
        <LanguageSwitcher />
      </div>
    </div>
  );
}
