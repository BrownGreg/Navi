import Link from "next/link";
import { notFound } from "next/navigation";
import { fetchPublic } from "@/lib/server-api";
import { getLocale, getDictionary, localeTag } from "@/lib/i18n/server";

type Meeting = {
  id: string;
  title: string;
  date: string;
  durationMin: number;
  cr?: {
    resume: string;
    decisions: string[];
    actions: { text: string; owner: string }[];
  };
};

export default async function SharedCRPage({ params }: { params: Promise<{ shareId: string }> }) {
  const { shareId } = await params;
  const [res, locale] = await Promise.all([fetchPublic(`/meetings/by-share/${shareId}`), getLocale()]);
  if (res.status === 404) return notFound();
  const meeting: Meeting = await res.json();
  const t = getDictionary(locale);
  const c = t.cr;

  return (
    <div className="page page-narrow">
      <p className="muted" style={{ marginBottom: 10 }}>{c.readOnlyNotice}</p>

      <div className="row" style={{ marginBottom: 8 }}>
        <span style={{ fontSize: 15, fontWeight: 500 }}>{meeting.title}</span>
        <span className="pill">{c.readOnlyPill}</span>
      </div>
      <p className="muted" style={{ marginBottom: 14 }}>
        {new Date(meeting.date).toLocaleString(localeTag(locale))} — {meeting.durationMin} min
      </p>

      {meeting.cr ? (
        <>
          <div className="label">{c.resume}</div>
          <div className="card">{meeting.cr.resume}</div>

          <div className="label">{c.decisions}</div>
          {meeting.cr.decisions.map((d, i) => (
            <div className="card" key={i}>{d}</div>
          ))}

          <div className="label">{c.actions}</div>
          {meeting.cr.actions.map((a, i) => (
            <div className="card" key={i}>
              <div className="row">
                <span>{a.text}</span>
                <span className="pill">{a.owner}</span>
              </div>
            </div>
          ))}
        </>
      ) : (
        <div className="card">{c.generating}</div>
      )}

      <Link href={`/rgpd?meetingId=${meeting.id}`}>
        <button className="btn">{c.exerciseRights}</button>
      </Link>
    </div>
  );
}
