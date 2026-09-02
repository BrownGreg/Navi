import Link from "next/link";
import { notFound } from "next/navigation";
import { fetchAuthed } from "@/lib/server-api";
import type { Meeting } from "@/lib/types";
import { getLocale, getDictionary, localeTag } from "@/lib/i18n/server";
import CrView from "./CrView";

export default async function MeetingPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { id } = await params;
  const [{ tab }, res, locale] = await Promise.all([searchParams, fetchAuthed(`/meetings/${id}`), getLocale()]);
  if (res.status === 404) return notFound();
  const meeting: Meeting = await res.json();
  const t = getDictionary(locale).app.reunion;

  const hasCR = meeting.status === "ready" && !!meeting.cr;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 20, padding: "26px 34px 16px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
          <span style={{ fontFamily: "var(--font-heading)", fontSize: 26, letterSpacing: "-0.02em" }}>{meeting.title}</span>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span className="tag tag-outline">{meeting.mode === "visio" ? t.modeVisio : t.modeDictaphone}</span>
            <span style={{ fontSize: 12, color: "var(--color-neutral-500)" }}>
              {new Date(meeting.date).toLocaleDateString(localeTag(locale), { day: "numeric", month: "long" })}
              {meeting.status === "ready" ? ` · ${meeting.durationMin} min` : t.processingSuffix}
              {meeting.source === "mock" ? t.demoSuffix : ""}
            </span>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {hasCR ? (
            <a href={`/api/meetings/${meeting.id}/pdf`} download className="btn btn-secondary" style={{ fontSize: 12 }}>{t.pdf}</a>
          ) : (
            <button className="btn btn-secondary" disabled style={{ fontSize: 12 }}>{t.pdf}</button>
          )}
          {hasCR ? (
            <Link href={`/reunion/${meeting.id}?tab=transcript`} className="btn btn-secondary" style={{ fontSize: 12 }}>{t.transcript}</Link>
          ) : (
            <button className="btn btn-secondary" disabled style={{ fontSize: 12 }}>{t.transcript}</button>
          )}
          <Link href={`/cr/${meeting.shareId}`} className="btn btn-primary" style={{ fontSize: 12 }}>{t.partager}</Link>
        </div>
      </div>

      {meeting.status === "processing" || !meeting.cr ? (
        <div style={{ padding: "0 34px" }}>
          <div className="card">{t.processingCard}</div>
        </div>
      ) : (
        <CrView meeting={meeting} initialTab={tab === "transcript" ? "transcript" : "resume"} />
      )}
    </div>
  );
}
