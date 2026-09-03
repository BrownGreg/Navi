"use client";

import Link from "next/link";
import { useState } from "react";
import type { Meeting } from "@/lib/types";
import { useI18n } from "@/lib/i18n/LocaleProvider";
import { format } from "@/lib/i18n";
import MeetingCard from "./MeetingCard";
import TodoList from "./TodoList";

type View = "grid" | "todo";

export default function DashboardView({ meetings: initialMeetings }: { meetings: Meeting[] }) {
  const { t } = useI18n();
  const d = t.app.dashboard;
  const [meetings, setMeetings] = useState(initialMeetings);
  const [view, setView] = useState<View>("grid");

  function handleRenamed(id: string, updated: Meeting) {
    setMeetings((prev) => prev.map((m) => (m.id === id ? updated : m)));
  }

  function handleDeleted(id: string) {
    setMeetings((prev) => prev.filter((m) => m.id !== id));
  }

  function handleActionUpdated(_meetingId: string, updated: Meeting) {
    setMeetings((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
  }

  return (
    <div className="page">
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12, marginBottom: 4 }}>
        <h1 style={{ fontFamily: "var(--font-heading)", fontSize: 24, margin: 0 }}>{d.title}</h1>
        <Link href="/new" className="btn btn-primary">{d.newMeeting}</Link>
      </div>
      <p className="secondary-text" style={{ marginBottom: 14 }}>{format(d.count, { count: meetings.length })}</p>

      <div style={{ display: "inline-flex", gap: 2, padding: 3, borderRadius: 999, background: "var(--color-neutral-900)", fontSize: 12, color: "var(--color-neutral-400)", marginBottom: 22 }}>
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

      {view === "grid" ? (
        <div className="meetings-grid">
          {meetings.map((m) => (
            <MeetingCard key={m.id} meeting={m} onRenamed={handleRenamed} onDeleted={handleDeleted} />
          ))}
        </div>
      ) : (
        <TodoList meetings={meetings} onActionUpdated={handleActionUpdated} />
      )}
    </div>
  );
}
