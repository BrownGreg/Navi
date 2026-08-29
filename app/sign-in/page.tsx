"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

function SignInInner() {
  const router = useRouter();
  const params = useSearchParams();
  const redirectTo = params.get("redirectTo") || "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit() {
    setLoading(true);
    setError(null);
    const res = await fetch("/api/auth/signin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });
    setLoading(false);

    if (!res.ok) {
      const body = await res.json().catch(() => null);
      setError(typeof body?.detail === "string" ? body.detail : "identifiants invalides");
      return;
    }

    router.push(redirectTo);
    router.refresh();
  }

  return (
    <div className="page">
      <h1>Connexion</h1>
      <p className="secondary-text" style={{ marginBottom: 14 }}>Accedez a vos reunions Navi</p>

      <div className="label">Email</div>
      <input
        className="input"
        style={{ marginBottom: 10 }}
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <div className="label">Mot de passe</div>
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

      <button className="btn btn-primary" disabled={!email || !password || loading} onClick={submit}>
        {loading ? "Connexion…" : "Se connecter"}
      </button>

      <p className="muted" style={{ marginTop: 14 }}>
        Pas encore de compte ? <Link href="/sign-up">Creer un compte</Link>
      </p>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={<div className="page">Chargement…</div>}>
      <SignInInner />
    </Suspense>
  );
}
