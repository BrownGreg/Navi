import Link from "next/link";
import { notFound } from "next/navigation";
import { fetchPublic } from "@/lib/server-api";

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
  const res = await fetchPublic(`/meetings/by-share/${shareId}`);
  if (res.status === 404) return notFound();
  const meeting: Meeting = await res.json();

  return (
    <div className="page page-narrow">
      <p className="muted" style={{ marginBottom: 10 }}>Lien recu par email — sans compte requis</p>

      <div className="row" style={{ marginBottom: 8 }}>
        <span style={{ fontSize: 15, fontWeight: 500 }}>{meeting.title}</span>
        <span className="pill">Lecture seule</span>
      </div>
      <p className="muted" style={{ marginBottom: 14 }}>
        {new Date(meeting.date).toLocaleString("fr-FR")} — {meeting.durationMin} min
      </p>

      {meeting.cr ? (
        <>
          <div className="label">Resume</div>
          <div className="card">{meeting.cr.resume}</div>

          <div className="label">Decisions</div>
          {meeting.cr.decisions.map((d, i) => (
            <div className="card" key={i}>{d}</div>
          ))}

          <div className="label">Actions</div>
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
        <div className="card">Compte-rendu en cours de generation.</div>
      )}

      <Link href={`/rgpd?meetingId=${meeting.id}`}>
        <button className="btn">Exercer mes droits RGPD</button>
      </Link>
    </div>
  );
}
