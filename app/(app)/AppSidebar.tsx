"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";
import type { Meeting } from "@/lib/types";

type Props = { meetings: Meeting[] };
type ModeFilter = "all" | "visio" | "dictaphone";

function dayLabel(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  const sameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  if (sameDay(d, today)) return "Aujourd'hui";
  if (sameDay(d, yesterday)) return "Hier";
  return d.toLocaleDateString("fr-FR", { weekday: "long" });
}

export default function AppSidebar({ meetings }: Props) {
  const pathname = usePathname();
  const [modeFilter, setModeFilter] = useState<ModeFilter>("all");
  const [search, setSearch] = useState("");

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
  }, [filtered]);

  return (
    <div className="app-sidebar">
      <div className="app-sidebar-top">
        <Link href="/new" className="btn btn-primary btn-block">+ Nouvelle reunion</Link>
        <input
          className="app-search"
          type="search"
          placeholder="Rechercher…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Rechercher une reunion"
        />
      </div>

      <div className="app-tag-row">
        <button
          className={`tag ${modeFilter === "all" ? "tag-accent" : "tag-outline"}`}
          style={{ border: "none", background: modeFilter === "all" ? undefined : "transparent" }}
          onClick={() => setModeFilter("all")}
        >
          Tout
        </button>
        <button
          className={`tag ${modeFilter === "visio" ? "tag-accent" : "tag-outline"}`}
          onClick={() => setModeFilter("visio")}
        >
          Visio
        </button>
        <button
          className={`tag ${modeFilter === "dictaphone" ? "tag-accent" : "tag-outline"}`}
          onClick={() => setModeFilter("dictaphone")}
        >
          Dictaphone
        </button>
      </div>

      <div className="app-list">
        {groups.length === 0 ? (
          <div className="app-empty-list">Aucune reunion ne correspond.</div>
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
                          en cours
                        </span>
                      ) : (
                        <span className="app-row-meta">
                          {new Date(m.date).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      )}
                    </div>
                    {processing ? (
                      <div className="app-row-progress"><span style={{ width: "40%" }} /></div>
                    ) : (
                      <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                        <span className={`tag ${m.mode === "visio" ? "tag-accent" : "tag-outline"}`} style={{ fontSize: 10 }}>
                          {m.mode === "visio" ? "Visio" : "Dictaphone"}
                        </span>
                        <span className="app-row-meta">{m.durationMin} min</span>
                      </div>
                    )}
                  </Link>
                );
              })}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
