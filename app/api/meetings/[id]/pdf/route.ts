import { NextResponse } from "next/server";
import { getMeetingById } from "@/lib/store";

export const runtime = "nodejs";

/**
 * GET /api/meetings/[id]/pdf
 *
 * Proxy vers le service IA pour l'export PDF.
 * Si le service IA n'est pas disponible, génère un PDF texte minimal.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const meeting = getMeetingById(id);
  if (!meeting) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  if (!meeting.cr) {
    return NextResponse.json(
      { error: "pas de compte-rendu disponible" },
      { status: 400 }
    );
  }

  const aiServiceUrl = process.env.AI_SERVICE_URL;

  if (aiServiceUrl) {
    try {
      const res = await fetch(`${aiServiceUrl}/meetings/${id}/pdf`);
      if (!res.ok) {
        return NextResponse.json(
          { error: "erreur service PDF" },
          { status: res.status }
        );
      }
      const blob = await res.arrayBuffer();
      return new Response(blob, {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="cr-${id}.pdf"`,
        },
      });
    } catch {
      // fall through to text fallback
    }
  }

  // Fallback: génère un PDF texte minimal (pas de dépendance externe)
  const cr = meeting.cr;
  const lines: string[] = [
    `Compte-rendu : ${meeting.title}`,
    `Date : ${new Date(meeting.date).toLocaleString("fr-FR")}`,
    `Durée : ${meeting.durationMin} min`,
    "",
    "RÉSUMÉ",
    cr.resume,
    "",
    "DÉCISIONS",
    ...cr.decisions.map((d) => `- ${d}`),
    "",
    "ACTIONS",
    ...cr.actions.map((a) => `- [${a.owner}] ${a.text}`),
    "",
    "THÈMES",
    cr.themes.join(", "),
  ];

  const text = lines.join("\n");

  return new Response(text, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Content-Disposition": `attachment; filename="cr-${id}.txt"`,
    },
  });
}
