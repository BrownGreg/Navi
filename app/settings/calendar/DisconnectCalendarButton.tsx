"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api-client";

type Props = {
  provider: "google" | "microsoft";
};

export default function DisconnectCalendarButton({ provider }: Props) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function disconnect() {
    setLoading(true);
    try {
      await apiFetch(`/api/calendar/${provider}/disconnect`, { method: "POST" });
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <button className="btn" onClick={disconnect} disabled={loading}>
      {loading ? "Deconnexion…" : "Deconnecter"}
    </button>
  );
}
