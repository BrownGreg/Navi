"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api-client";
import { useI18n } from "@/lib/i18n/LocaleProvider";

type Props = {
  provider: "google" | "microsoft";
};

export default function DisconnectCalendarButton({ provider }: Props) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { t } = useI18n();

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
      {loading ? t.app.settingsCalendar.disconnecting : t.app.settingsCalendar.disconnect}
    </button>
  );
}
