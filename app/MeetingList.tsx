"use client";

import Link from "next/link";
import { useState, useMemo } from "react";
import type { Meeting } from "@/lib/store";

type Props = {
  meetings: Meeting[];
};

type ModeFilter = "all" | "visio" | "dictaphone";
type StatusFilter = "all" | "ready" | "processing";

function computeThemeFrequencies(meetings: Meeting[]): { theme: string; count: number }[] {
  const freq: Record<string, number> = {};
  for (const m of meetings) {
    if (m.cr?.themes) {
      for (const t of m.cr.themes) {
        freq[t] = (freq[t] ?? 0) + 1;
      }
    }
  }
  return Object.entries(freq)
    .map(([theme, count]) => ({ theme, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
}

export default function MeetingList({ meetings }: Props) {
  const [modeFilter, setModeFilter] = useState<ModeFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [search, setSearch] = useState("");

  // Computed indicators from the full list
  const totalMeetings = meetings.length;
  const totalMinutes = meetings
    .filter((m) => m.status === "ready")
    .reduce((acc, m) => acc + (m.durationMin ?? 0), 0);
  const processingCount = meetings.filter((m) => m.status === "processing").length;

  // Filtered list (no extra API calls)
  const filtered = useMemo(() => {
    return meetings.filter((m) => {
      if (modeFilter !== "all" && m.mode !== modeFilter) return false;
      if (statusFilter === "ready" && m.status !== "ready") return false;
      if (statusFilter === "processing" && m.status !== "processing") return false;
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        if (!m.title.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [meetings, modeFilter, statusFilter, search]);

  // Theme chart data (from full list)
  const topThemes = useMemo(() => computeThemeFrequencies(meetings), [meetings]);
  const maxThemeCount = topThemes[0]?.count ?? 1;

  const selectStyle: React.CSSProperties = {
    padding: "5px 8px",
    border: "1px solid var(--border-strong)",
    borderRadius: "var(--radius)",
    background: "var(--surface-2)",
    color: "var(--text-primary)",
    fontSize: 13,
    cursor: "pointer",
  };

  return (
    <>
      {/* Indicators */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gap: 8,
          marginBottom: 16,
        }}
      >
        <div className="card" style={{ textAlign: "center", padding: "10px 6px" }}>
          <div style={{ fontSize: 22, fontWeight: 600 }}>{totalMeetings}</div>
          <div className="muted">Reunions</div>
        </div>
        <div className="card" style={{ textAlign: "center", padding: "10px 6px" }}>
          <div style={{ fontSize: 22, fontWeight: 600 }}>{totalMinutes}</div>
          <div className="muted">min totales</div>
        </div>
        <div className="card" style={{ textAlign: "center", padding: "10px 6px" }}>
          <div style={{ fontSize: 22, fontWeight: 600 }}>{processingCount}</div>
          <div className="muted">En traitement</div>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
        <select
          className="input"
          style={{ ...selectStyle, flex: "0 0 auto", width: "auto" }}
          value={modeFilter}
          onChange={(e) => setModeFilter(e.target.value as ModeFilter)}
          aria-label="Filtrer par mode"
        >
          <option value="all">Tous les modes</option>
          <option value="dictaphone">Dictaphone</option>
          <option value="visio">Visio</option>
        </select>

        <select
          className="input"
          style={{ ...selectStyle, flex: "0 0 auto", width: "auto" }}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
          aria-label="Filtrer par statut"
        >
          <option value="all">Tous les statuts</option>
          <option value="ready">Terminees</option>
          <option value="processing">En traitement</option>
        </select>

        <input
          className="input"
          style={{ flex: 1, minWidth: 120 }}
          type="search"
          placeholder="Rechercher..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Rechercher une reunion"
        />
      </div>

      {/* Theme frequency chart */}
      {topThemes.length > 0 && (
        <div className="card" style={{ marginBottom: 16, padding: "12px 14px" }}>
          <div className="label" style={{ marginBottom: 10 }}>Themes les plus frequents</div>
          {topThemes.map(({ theme, count }) => {
            const pct = Math.round((count / maxThemeCount) * 100);
            return (
              <div key={theme} style={{ marginBottom: 8 }}>
                <div
                  className="row"
                  style={{ marginBottom: 3, justifyContent: "space-between" }}
                >
                  <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>{theme}</span>
                  <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{count}</span>
                </div>
                <div
                  style={{
                    background: "var(--border)",
                    borderRadius: 4,
                    overflow: "hidden",
                    height: 8,
                  }}
                >
                  <div
                    style={{
                      width: `${pct}%`,
                      background: "#2563eb",
                      height: 8,
                      borderRadius: 4,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Meeting list */}
      {filtered.length === 0 ? (
        <p className="muted" style={{ textAlign: "center", marginTop: 24 }}>
          Aucune reunion ne correspond aux filtres.
        </p>
      ) : (
        filtered.map((m) => (
          <Link
            key={m.id}
            href={`/reunion/${m.id}`}
            style={{ textDecoration: "none", color: "inherit" }}
          >
            <div className="card">
              <div className="row">
                <span style={{ fontSize: 14 }}>{m.title}</span>
                <span className="pill">{m.mode === "visio" ? "Visio" : "Dictaphone"}</span>
              </div>
              <div className="muted" style={{ marginTop: 4 }}>
                {new Date(m.date).toLocaleDateString("fr-FR", {
                  day: "numeric",
                  month: "long",
                })}
                {" — "}
                {m.status === "ready" ? `${m.durationMin} min` : "en cours de traitement"}
              </div>
              {m.cr?.themes && m.cr.themes.length > 0 && (
                <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginTop: 6 }}>
                  {m.cr.themes.slice(0, 3).map((t, i) => (
                    <span className="pill accent" key={i} style={{ fontSize: 11 }}>
                      {t}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </Link>
        ))
      )}
    </>
  );
}
