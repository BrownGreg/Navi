import Link from "next/link";
import { redirect } from "next/navigation";
import { fetchAuthed } from "@/lib/server-api";
import type { Meeting } from "@/lib/types";

// La liste des reunions vit desormais dans la coquille persistante
// (app/(app)/AppSidebar.tsx), visible sur tout /dashboard, /reunion/[id],
// /new et /settings/*. Ce point d'entree se contente de rebondir vers la
// derniere reunion, comme un simple espace de travail plutot qu'un ecran
// separe qui dupliquerait la liste.
export default async function DashboardPage() {
  const res = await fetchAuthed("/meetings");
  const meetings: Meeting[] = res.ok ? await res.json() : [];

  if (meetings.length > 0) {
    const [mostRecent] = meetings;
    redirect(`/reunion/${mostRecent.id}`);
  }

  return (
    <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", padding: 40 }}>
      <div style={{ textAlign: "center", maxWidth: 320 }}>
        <p style={{ fontFamily: "var(--font-heading)", fontSize: 21, margin: "0 0 8px" }}>Aucune reunion pour l&apos;instant</p>
        <p className="secondary-text" style={{ marginBottom: 18 }}>Creez la premiere pour voir apparaitre son compte-rendu ici.</p>
        <Link href="/new" className="btn btn-primary">+ Nouvelle reunion</Link>
      </div>
    </div>
  );
}
