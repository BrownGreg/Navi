"use client";

import Link from "next/link";
import { useState } from "react";
import type { Meeting, Project } from "@/lib/types";
import { useI18n } from "@/lib/i18n/LocaleProvider";
import { localeTag } from "@/lib/i18n";
import { apiFetch } from "@/lib/api-client";

const NEW_PROJECT = "__new__";

type Props = {
  meeting: Meeting;
  projects: Project[];
  onUpdated: (id: string, meeting: Meeting) => void;
  onDeleted: (id: string) => void;
  onProjectCreated: (project: Project) => void;
};

export default function MeetingCard({ meeting, projects, onUpdated, onDeleted, onProjectCreated }: Props) {
  const { t, locale } = useI18n();
  const d = t.app.dashboard;
  const s = t.app.sidebar;
  const [menuOpen, setMenuOpen] = useState(false);
  const [projectMenuOpen, setProjectMenuOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(meeting.title);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const processing = meeting.status === "processing";

  async function saveRename() {
    const trimmed = title.trim();
    if (!trimmed || trimmed === meeting.title) {
      setTitle(meeting.title);
      setEditing(false);
      return;
    }
    setBusy(true);
    setError(null);
    const res = await apiFetch(`/api/meetings/${meeting.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: trimmed }),
    });
    setBusy(false);
    if (res.ok) {
      onUpdated(meeting.id, await res.json());
      setEditing(false);
    } else {
      setError(d.renameError);
    }
  }

  async function handleDelete() {
    setMenuOpen(false);
    if (!window.confirm(d.confirmDelete)) return;
    setBusy(true);
    const res = await apiFetch(`/api/meetings/${meeting.id}`, { method: "DELETE" });
    setBusy(false);
    if (res.ok) {
      onDeleted(meeting.id);
    } else {
      setError(d.deleteError);
    }
  }

  async function assignProject(projectId: string | null) {
    setBusy(true);
    setError(null);
    const res = await apiFetch(`/api/meetings/${meeting.id}/project`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectId }),
    });
    setBusy(false);
    if (res.ok) {
      onUpdated(meeting.id, await res.json());
    } else {
      setError(d.projectError);
    }
  }

  async function handleProjectSelect(value: string) {
    setMenuOpen(false);
    setProjectMenuOpen(false);
    if (value === NEW_PROJECT) {
      const name = window.prompt(d.newProjectPrompt)?.trim();
      if (!name) return;
      setBusy(true);
      const res = await apiFetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      setBusy(false);
      if (res.ok) {
        const project: Project = await res.json();
        onProjectCreated(project);
        await assignProject(project.id);
      } else {
        setError(d.projectError);
      }
      return;
    }
    await assignProject(value || null);
  }

  return (
    <div className="card" style={{ position: "relative" }}>
      {editing ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <input
            className="input"
            autoFocus
            value={title}
            disabled={busy}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") saveRename();
              if (e.key === "Escape") { setTitle(meeting.title); setEditing(false); }
            }}
            style={{ fontSize: 13 }}
          />
          <div style={{ display: "flex", gap: 6 }}>
            <button className="btn btn-primary" disabled={busy} onClick={saveRename} style={{ fontSize: 11, padding: "4px 10px" }}>{d.renameSave}</button>
            <button className="btn btn-secondary" disabled={busy} onClick={() => { setTitle(meeting.title); setEditing(false); }} style={{ fontSize: 11, padding: "4px 10px" }}>{d.renameCancel}</button>
          </div>
        </div>
      ) : (
        <Link href={`/reunion/${meeting.id}`} style={{ color: "inherit", textDecoration: "none", display: "block" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8, paddingRight: 20 }}>
            <span className="card-title" style={{ fontSize: 15 }}>{meeting.title}</span>
            {processing ? (
              <span className="app-row-live">
                <span className="app-row-live-dot pulse" />
                {s.live}
              </span>
            ) : null}
          </div>
          <div className="card-meta">
            <span className={`tag ${meeting.mode === "visio" ? "tag-accent" : "tag-outline"}`}>
              {meeting.mode === "visio" ? s.filterVisio : s.filterDictaphone}
            </span>
            <span>{new Date(meeting.date).toLocaleDateString(localeTag(locale), { day: "2-digit", month: "short" })}</span>
            {!processing ? <span>{meeting.durationMin} {s.minutes}</span> : null}
          </div>
          {meeting.project ? (
            <div style={{ marginTop: 6 }}>
              <span className="tag tag-neutral" style={{ fontSize: 10 }}>{meeting.project.name}</span>
            </div>
          ) : null}
        </Link>
      )}

      {error ? <div style={{ fontSize: 10.5, color: "var(--danger)", marginTop: 4 }}>{error}</div> : null}

      {!editing ? (
        <div style={{ position: "absolute", top: 10, right: 10 }}>
          <button
            aria-label={d.menuAria}
            onClick={() => setMenuOpen((v) => !v)}
            style={{ background: "transparent", border: "none", color: "var(--color-neutral-500)", cursor: "pointer", fontSize: 16, lineHeight: 1, padding: 2 }}
          >
            ⋯
          </button>
          {menuOpen ? (
            <>
              <div style={{ position: "fixed", inset: 0, zIndex: 1 }} onClick={() => { setMenuOpen(false); setProjectMenuOpen(false); }} />
              <div
                style={{
                  position: "absolute",
                  top: "100%",
                  right: 0,
                  zIndex: 2,
                  background: "var(--color-surface)",
                  boxShadow: "var(--shadow-md)",
                  borderRadius: "var(--radius-md)",
                  padding: 4,
                  display: "flex",
                  flexDirection: "column",
                  minWidth: 150,
                }}
              >
                <button
                  onClick={() => { setMenuOpen(false); setEditing(true); }}
                  style={{ textAlign: "left", background: "transparent", border: "none", padding: "7px 10px", fontSize: 12.5, color: "var(--color-neutral-200)", cursor: "pointer", borderRadius: "var(--radius-sm)" }}
                >
                  {d.rename}
                </button>
                <div style={{ position: "relative" }}>
                  <button
                    onClick={(e) => { e.stopPropagation(); setProjectMenuOpen((v) => !v); }}
                    style={{ width: "100%", textAlign: "left", background: "transparent", border: "none", padding: "7px 10px", fontSize: 12.5, color: "var(--color-neutral-200)", cursor: "pointer", borderRadius: "var(--radius-sm)" }}
                  >
                    {d.project}…
                  </button>
                  {projectMenuOpen ? (
                    <div
                      style={{
                        position: "absolute",
                        left: "100%",
                        top: 0,
                        marginLeft: 4,
                        background: "var(--color-surface)",
                        boxShadow: "var(--shadow-md)",
                        borderRadius: "var(--radius-md)",
                        padding: 4,
                        display: "flex",
                        flexDirection: "column",
                        minWidth: 150,
                      }}
                    >
                      <button
                        onClick={() => handleProjectSelect("")}
                        style={{ textAlign: "left", background: "transparent", border: "none", padding: "7px 10px", fontSize: 12.5, color: "var(--color-neutral-200)", cursor: "pointer", borderRadius: "var(--radius-sm)" }}
                      >
                        {d.noProject}
                      </button>
                      {projects.map((p) => (
                        <button
                          key={p.id}
                          onClick={() => handleProjectSelect(p.id)}
                          style={{ textAlign: "left", background: "transparent", border: "none", padding: "7px 10px", fontSize: 12.5, color: "var(--color-neutral-200)", cursor: "pointer", borderRadius: "var(--radius-sm)" }}
                        >
                          {p.name}
                        </button>
                      ))}
                      <button
                        onClick={() => handleProjectSelect(NEW_PROJECT)}
                        style={{ textAlign: "left", background: "transparent", border: "none", padding: "7px 10px", fontSize: 12.5, color: "var(--color-accent-300)", cursor: "pointer", borderRadius: "var(--radius-sm)" }}
                      >
                        {d.newProject}
                      </button>
                    </div>
                  ) : null}
                </div>
                <button
                  onClick={handleDelete}
                  style={{ textAlign: "left", background: "transparent", border: "none", padding: "7px 10px", fontSize: 12.5, color: "var(--danger)", cursor: "pointer", borderRadius: "var(--radius-sm)" }}
                >
                  {d.delete}
                </button>
              </div>
            </>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
