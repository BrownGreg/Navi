import Link from "next/link";
import { fetchAuthed } from "@/lib/server-api";

type RgpdRequestType = "access" | "rectification" | "erasure";

type RgpdRequestOut = {
  id: string;
  email: string;
  meetingId: string;
  type: RgpdRequestType;
  createdAt: string;
};

const TYPE_LABELS: Record<RgpdRequestType, string> = {
  access: "Acces a mes donnees",
  rectification: "Rectification",
  erasure: "Suppression de ma voix et de mes propos"
};

export default async function RgpdRequestsPage() {
  // /api/rgpd-requests filtre deja par organisateur cote serveur (voir
  // ai-service/routers/rgpd.py) : ce que cette page recoit ne concerne que
  // les reunions de l'utilisateur connecte.
  const res = await fetchAuthed("/rgpd-requests");
  const requests: RgpdRequestOut[] = res.ok ? await res.json() : [];

  return (
    <div className="page">
      <div className="top-actions">
        <Link href="/">← Retour</Link>
      </div>

      <h1>Demandes RGPD reçues</h1>
      <p className="secondary-text" style={{ marginBottom: 14 }}>
        Demandes deposees par des participants concernant vos reunions. A traiter sous 30 jours
        (art. 12 RGPD) — le contact (par email, a l&apos;adresse indiquee) reste manuel.
      </p>

      {requests.length === 0 ? (
        <div className="card">Aucune demande recue pour l&apos;instant.</div>
      ) : (
        requests.map((r) => (
          <div className="card" key={r.id} style={{ marginBottom: 10, padding: 14 }}>
            <div className="row">
              <span style={{ fontWeight: 500 }}>{TYPE_LABELS[r.type] ?? r.type}</span>
              <span className="muted">
                {new Date(r.createdAt).toLocaleDateString("fr-FR", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric"
                })}
              </span>
            </div>
            <p className="secondary-text" style={{ marginTop: 4 }}>{r.email}</p>
            <Link href={`/reunion/${r.meetingId}`} className="muted" style={{ fontSize: 12 }}>
              Voir la reunion concernee →
            </Link>
          </div>
        ))
      )}
    </div>
  );
}
