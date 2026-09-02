"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useI18n } from "@/lib/i18n/LocaleProvider";

export default function SignUpPage() {
  const router = useRouter();
  const { t } = useI18n();
  const s = t.signUp;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit() {
    setLoading(true);
    setError(null);
    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });
    setLoading(false);

    if (!res.ok) {
      const body = await res.json().catch(() => null);
      setError(typeof body?.detail === "string" ? body.detail : s.errorFallback);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="page page-narrow">
      <h1>{s.h1}</h1>
      <p className="secondary-text" style={{ marginBottom: 14 }}>{s.sub}</p>

      <div className="label">{s.emailLabel}</div>
      <input
        className="input"
        style={{ marginBottom: 10 }}
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <div className="label">{s.passwordLabel}</div>
      <input
        className="input"
        style={{ marginBottom: 10 }}
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      {error ? (
        <p className="secondary-text" style={{ color: "var(--danger)", marginBottom: 10 }}>{error}</p>
      ) : null}

      <button className="btn btn-primary btn-block" disabled={!email || password.length < 8 || loading} onClick={submit}>
        {loading ? s.submitting : s.submit}
      </button>

      <p className="muted" style={{ marginTop: 14 }}>
        {s.alreadyAccount} <Link href="/sign-in">{s.signIn}</Link>
      </p>
      <p className="muted" style={{ marginTop: 4 }}>
        <Link href="/aide">{s.aide}</Link> · <Link href="/faq">{s.faq}</Link>
      </p>
    </div>
  );
}
