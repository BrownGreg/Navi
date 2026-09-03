import Link from "next/link";
import { fetchAuthed } from "@/lib/server-api";
import type { Meeting, Project } from "@/lib/types";
import { getLocale, getDictionary } from "@/lib/i18n/server";
import DashboardView from "./DashboardView";

// Vrai ecran d'accueil des reunions (voir icone "Reunions" du rail, qui
// pointe ici) : grille + vue to-do plutot qu'un rebond vers la plus recente -
// la liste filtrable/recherche vit toujours dans la coquille persistante
// (AppSidebar), cette page-ci sert de vue d'ensemble avec plus d'espace et
// de detail par reunion (renommer/supprimer, priorites d'actions, regroupement
// par projet/client).
export default async function DashboardPage() {
  const locale = await getLocale();
  const [meetingsRes, projectsRes] = await Promise.all([
    fetchAuthed(`/meetings?locale=${locale}`),
    fetchAuthed("/projects"),
  ]);
  const meetings: Meeting[] = meetingsRes.ok ? await meetingsRes.json() : [];
  const projects: Project[] = projectsRes.ok ? await projectsRes.json() : [];
  const t = getDictionary(locale).app.dashboard;

  if (meetings.length === 0) {
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

  return <DashboardView meetings={meetings} projects={projects} />;
}
