"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  meetingId: string;
};

export default function ClassifyButton({ meetingId }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleClassify() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/classify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ meetingId }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: "Erreur inconnue" }));
        setError(data.error ?? "Erreur lors de la classification");
        return;
      }
      router.refresh();
    } catch {
      setError("Impossible de joindre le serveur");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <button className="btn" onClick={handleClassify} disabled={loading}>
        {loading ? "Classification en cours..." : "Classer la reunion"}
      </button>
      {error && (
        <p className="muted" style={{ color: "var(--danger)", marginTop: 4 }}>
          {error}
        </p>
      )}
    </div>
  );
}
