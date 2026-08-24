import Link from "next/link";
import { getAllMeetings } from "@/lib/store";
import MeetingList from "./MeetingList";

export default function HomePage() {
  const meetings = getAllMeetings();

  return (
    <div className="page">
      <div className="row" style={{ marginBottom: 14 }}>
        <div style={{ fontWeight: 500, fontSize: 15 }}>Scribe</div>
        <Link href="/participant/consent" style={{ fontSize: 12 }}>Vue participant</Link>
      </div>

      <h1>Historique</h1>

      <MeetingList meetings={meetings} />

      <Link href="/new">
        <button className="btn btn-primary">+ Nouvelle reunion</button>
      </Link>
    </div>
  );
}
