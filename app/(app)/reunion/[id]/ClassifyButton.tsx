"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/lib/i18n/LocaleProvider";

type Props = {
  meetingId: string;
};

export default function ClassifyButton({ meetingId }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { t } = useI18n();
  const c = t.app.classify;

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
        const data = await res.json().catch(() => ({ error: c.errorUnknown }));
        setError(data.error ?? c.errorClassify);
        return;
      }
      router.refresh();
    } catch {
      setError(c.errorServer);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <button className="btn" onClick={handleClassify} disabled={loading}>
        {loading ? c.loading : c.button}
      </button>
      {error && (
        <p className="muted" style={{ color: "var(--danger)", marginTop: 4 }}>
          {error}
        </p>
      )}
    </div>
  );
}
