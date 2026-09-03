"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { Meeting, Project } from "@/lib/types";
import { useI18n } from "@/lib/i18n/LocaleProvider";
import { format } from "@/lib/i18n";
import MeetingCard from "./MeetingCard";
import TodoList from "./TodoList";

type View = "grid" | "todo";
const NO_PROJECT = "__none__";

export default function DashboardView({ meetings: initialMeetings, projects: initialProjects }: { meetings: Meeting[]; projects: Project[] }) {
  const { t } = useI18n();
  const d = t.app.dashboard;
  const [meetings, setMeetings] = useState(initialMeetings);
  const [projects, setProjects] = useState(initialProjects);
  const [view, setView] = useState<View>("grid");
  const [projectFilter, setProjectFilter] = useState<string>("all");

  function handleUpdated(id: string, updated: Meeting) {
    setMeetings((prev) => prev.map((m) => (m.id === id ? updated : m)));
  }

  function handleDeleted(id: string) {
    setMeetings((prev) => prev.filter((m) => m.id !== id));
  }

  function handleProjectCreated(project: Project) {
    setProjects((prev) => [...prev, project].sort((a, b) => a.name.localeCompare(b.name)));
  }

  const filteredMeetings = useMemo(() => {
    if (projectFilter === "all") return meetings;
    if (projectFilter === NO_PROJECT) return meetings.filter((m) => !m.project);
    return meetings.filter((m) => m.project?.id === projectFilter);
  }, [meetings, projectFilter]);

  const groupedByProject = useMemo(() => {
    const groups = new Map<string, { label: string; items: Meeting[] }>();
    for (const m of filteredMeetings) {
      const key = m.project?.id ?? NO_PROJECT;
      const label = m.project?.name ?? d.noProject;
      if (!groups.has(key)) groups.set(key, { label, items: [] });
      groups.get(key)!.items.push(m);
    }
    // Groupes nommes d'abord (tries alphabetiquement), "Sans projet" toujours en dernier.
    return Array.from(groups.entries()).sort(([keyA], [keyB]) => {
      if (keyA === NO_PROJECT) return 1;
      if (keyB === NO_PROJECT) return -1;
      return groups.get(keyA)!.label.localeCompare(groups.get(keyB)!.label);
    });
  }, [filteredMeetings, d.noProject]);

  return (
    <div className="page">
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12, marginBottom: 4 }}>
        <h1 style={{ fontFamily: "var(--font-heading)", fontSize: 24, margin: 0 }}>{d.title}</h1>
        <Link href="/new" className="btn btn-primary">{d.newMeeting}</Link>
      </div>
      <p className="secondary-text" style={{ marginBottom: 14 }}>{format(d.count, { count: filteredMeetings.length })}</p>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10, marginBottom: 22 }}>
        <div style={{ display: "inline-flex", gap: 2, padding: 3, borderRadius: 999, background: "var(--color-neutral-900)", fontSize: 12, color: "var(--color-neutral-400)" }}>
          <button
            onClick={() => setView("grid")}
            style={{
              padding: "6px 15px", borderRadius: 999, border: "none", cursor: "pointer", font: "inherit",
              background: view === "grid" ? "var(--color-surface)" : "transparent",
              color: view === "grid" ? "var(--color-neutral-100)" : "var(--color-neutral-400)",
              boxShadow: view === "grid" ? "var(--shadow-sm)" : "none",
            }}
          >
            {d.viewGrid}
          </button>
          <button
            onClick={() => setView("todo")}
            style={{
              padding: "6px 15px", borderRadius: 999, border: "none", cursor: "pointer", font: "inherit",
              background: view === "todo" ? "var(--color-surface)" : "transparent",
              color: view === "todo" ? "var(--color-neutral-100)" : "var(--color-neutral-400)",
              boxShadow: view === "todo" ? "var(--shadow-sm)" : "none",
            }}
          >
            {d.viewTodo}
          </button>
        </div>

        {projects.length > 0 ? (
          <select
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
            style={{ fontSize: 12, background: "var(--color-neutral-900)", color: "var(--color-neutral-300)", border: "1px solid var(--color-neutral-800)", borderRadius: "var(--radius-md)", padding: "6px 10px" }}
          >
            <option value="all">{d.allProjects}</option>
            <option value={NO_PROJECT}>{d.noProject}</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        ) : null}
      </div>

      {view === "grid" ? (
        projectFilter === "all" ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
            {groupedByProject.map(([key, group]) => (
              <div key={key}>
                <div style={{ fontSize: 11, letterSpacing: "0.07em", textTransform: "uppercase", color: "var(--color-neutral-500)", marginBottom: 10 }}>
                  {group.label}
                </div>
                <div className="meetings-grid">
                  {group.items.map((m) => (
                    <MeetingCard
                      key={m.id}
                      meeting={m}
                      projects={projects}
                      onUpdated={handleUpdated}
                      onDeleted={handleDeleted}
                      onProjectCreated={handleProjectCreated}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="meetings-grid">
            {filteredMeetings.map((m) => (
              <MeetingCard
                key={m.id}
                meeting={m}
                projects={projects}
                onUpdated={handleUpdated}
                onDeleted={handleDeleted}
                onProjectCreated={handleProjectCreated}
              />
            ))}
          </div>
        )
      ) : (
        <TodoList meetings={filteredMeetings} onActionUpdated={handleUpdated} />
      )}
    </div>
  );
}
