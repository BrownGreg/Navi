"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function SignUpPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  async function submit() {
    setSending(true);
    setError(null);
    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });
    setSending(false);

    if (!res.ok) {
      const body = await res.json().catch(() => null);
      setError(body?.error || "inscription impossible");
      return;
    }
    router.push("/");
  }

  return (
    <div className="page">
      <h1>Créer un compte</h1>

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
        placeholder="8 caractères minimum"
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
        disabled={!email || password.length < 8 || sending}
        onClick={submit}
      >
        {sending ? "Création…" : "Créer mon compte"}
      </button>

      <p className="secondary-text" style={{ marginTop: 12 }}>
        Déjà un compte ? <Link href="/sign-in">Se connecter</Link>
      </p>
    </div>
  );
}
