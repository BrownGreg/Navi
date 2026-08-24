"use client";

import { useRouter } from "next/navigation";

export function SignOutButton() {
  const router = useRouter();

  async function signOut() {
    await fetch("/api/auth/signout", { method: "POST" });
    router.push("/sign-in");
    router.refresh();
  }

  return (
    <button
      onClick={signOut}
      className="secondary-text"
      style={{ background: "none", border: "none", padding: 0, cursor: "pointer", textDecoration: "underline" }}
    >
      Se deconnecter
    </button>
  );
}
