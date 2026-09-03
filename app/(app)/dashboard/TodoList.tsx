"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { Meeting } from "@/lib/types";
import { useI18n } from "@/lib/i18n/LocaleProvider";
import { apiFetch } from "@/lib/api-client";

const PRIORITIES = ["P0", "P1", "P2", "P3", "P4", "P5"] as const;

type Props = {
  meetings: Meeting[];
  onActionUpdated: (meetingId: string, updated: Meeting) => void;
};

type FlatAction = {
  meetingId: string;
  meetingTitle: string;
  index: number;
  text: string;
  owner: string;
  priority?: string | null;
  done?: boolean;
};

function priorityRank(p?: string | null): number {
  if (!p) return PRIORITIES.length;
  const idx = PRIORITIES.indexOf(p as (typeof PRIORITIES)[number]);
  return idx === -1 ? PRIORITIES.length : idx;
}

export default function TodoList({ meetings, onActionUpdated }: Props) {
  const { t } = useI18n();
  const d = t.app.dashboard;
  const p = t.app.actionPriority;
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const [errorKey, setErrorKey] = useState<string | null>(null);

  const items = useMemo(() => {
    const flat: FlatAction[] = [];
    for (const m of meetings) {
      (m.cr?.actions ?? []).forEach((a, i) => {
        flat.push({ meetingId: m.id, meetingTitle: m.title, index: i, ...a });
      });
    }
    return flat.sort((a, b) => {
      if (!!a.done !== !!b.done) return a.done ? 1 : -1;
      return priorityRank(a.priority) - priorityRank(b.priority);
    });
  }, [meetings]);

  async function update(item: FlatAction, patch: { priority?: string | null; done?: boolean }) {
    const key = `${item.meetingId}:${item.index}`;
    setPendingKey(key);
    setErrorKey(null);
    const res = await apiFetch(`/api/meetings/${item.meetingId}/actions/${item.index}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        priority: patch.priority !== undefined ? patch.priority || null : item.priority ?? null,
        done: patch.done !== undefined ? patch.done : item.done ?? false,
      }),
    });
    setPendingKey(null);
    if (res.ok) {
      onActionUpdated(item.meetingId, await res.json());
    } else {
      setErrorKey(key);
    }
  }

  if (items.length === 0) {
    return <p className="secondary-text">{d.todoEmpty}</p>;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 2, maxWidth: 720 }}>
      {items.map((item) => {
        const key = `${item.meetingId}:${item.index}`;
        const busy = pendingKey === key;
        return (
          <div key={key} style={{ display: "flex", flexDirection: "column", gap: 3, padding: "10px 4px", borderBottom: "1px solid var(--color-neutral-900)" }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
              <input
                type="checkbox"
                checked={!!item.done}
                disabled={busy}
                onChange={(e) => update(item, { done: e.target.checked })}
                style={{ width: 15, height: 15, marginTop: 2, flexShrink: 0, accentColor: "var(--color-accent)" }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13.5, lineHeight: 1.45, color: item.done ? "var(--color-neutral-500)" : "var(--color-neutral-200)", textDecoration: item.done ? "line-through" : "none" }}>
                  {item.text}
                </div>
                <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 3 }}>
                  <span style={{ fontSize: 11, color: "var(--color-neutral-500)" }}>{item.owner}</span>
                  <span style={{ fontSize: 11, color: "var(--color-neutral-600)" }}>·</span>
                  <Link href={`/reunion/${item.meetingId}`} style={{ fontSize: 11, color: "var(--color-accent-300)" }}>
                    {item.meetingTitle}
                  </Link>
                </div>
              </div>
              <select
                value={item.priority ?? ""}
                disabled={busy}
                onChange={(e) => update(item, { priority: e.target.value })}
                aria-label={p.label}
                style={{
                  fontSize: 10,
                  background: "var(--color-neutral-800)",
                  color: "var(--color-neutral-300)",
                  border: "1px solid var(--color-neutral-700)",
                  borderRadius: "var(--radius-sm)",
                  padding: "2px 3px",
                  flexShrink: 0,
                }}
              >
                <option value="">{p.none}</option>
                {PRIORITIES.map((prio) => (
                  <option key={prio} value={prio}>{prio}</option>
                ))}
              </select>
            </div>
            {errorKey === key ? <span style={{ fontSize: 10.5, color: "var(--danger)", marginLeft: 25 }}>{p.saveError}</span> : null}
          </div>
        );
      })}
    </div>
  );
}
