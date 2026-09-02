import Link from "next/link";
import { redirect } from "next/navigation";
import { fetchAuthed } from "@/lib/server-api";
import type { Meeting } from "@/lib/types";
import { getLocale, getDictionary } from "@/lib/i18n/server";

// La liste des reunions vit desormais dans la coquille persistante
// (app/(app)/AppSidebar.tsx), visible sur tout /dashboard, /reunion/[id],
// /new et /settings/*. Ce point d'entree se contente de rebondir vers la
// derniere reunion, comme un simple espace de travail plutot qu'un ecran
// separe qui dupliquerait la liste.
export default async function DashboardPage() {
  const [res, locale] = await Promise.all([fetchAuthed("/meetings"), getLocale()]);
  const meetings: Meeting[] = res.ok ? await res.json() : [];

  if (meetings.length > 0) {
    const [mostRecent] = meetings;
    redirect(`/reunion/${mostRecent.id}`);
  }

  const t = getDictionary(locale).app.dashboard;

  return (
    <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", padding: 40 }}>
      <div style={{ textAlign: "center", maxWidth: 320 }}>
        <p style={{ fontFamily: "var(--font-heading)", fontSize: 21, margin: "0 0 8px" }}>{t.emptyTitle}</p>
        <p className="secondary-text" style={{ marginBottom: 18 }}>{t.emptyBody}</p>
        <Link href="/new" className="btn btn-primary">{t.newMeeting}</Link>
      </div>
    </div>
  );
}
