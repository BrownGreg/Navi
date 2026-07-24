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
  const [sending, setSending] = useState(false);

  async function submit() {
    setSending(true);
    setError(null);
    const res = await fetch("/api/auth/signin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });
    setSending(false);

    if (!res.ok) {
      const body = await res.json().catch(() => null);
      setError(body?.error || "identifiants invalides");
      return;
    }
    router.push(redirectTo);
  }

  return (
    <div className="page">
      <h1>Se connecter</h1>

      <div className="label">Email</div>
      <input
        className="input"
        style={{ marginBottom: 10 }}
        type="email"
        placeholder="prenom.nom@exemple.com"
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

      {error && (
        <p className="secondary-text" style={{ color: "var(--danger)", marginBottom: 10 }}>
          {error}
        </p>
      )}

      <button
        className="btn btn-primary"
        disabled={!email || !password || sending}
        onClick={submit}
      >
        {sending ? "Connexion…" : "Se connecter"}
      </button>

      <p className="secondary-text" style={{ marginTop: 12 }}>
        Pas encore de compte ? <Link href="/sign-up">Créer un compte</Link>
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
