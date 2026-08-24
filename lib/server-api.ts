// Helper reserve aux Server Components. Un fetch() execute pendant le rendu
// serveur tourne dans le process Node lui-meme : il ne passe jamais par le
// routeur Next (contrairement a un fetch() du navigateur), donc le rewrite
// /api/* de next.config.js ne s'applique pas ici. On appelle directement
// AI_SERVICE_URL et on repasse manuellement le cookie de session recu par la
// requete entrante (next/headers ne le forward pas automatiquement).

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const AI_SERVICE_URL = process.env.AI_SERVICE_URL ?? "http://localhost:8000";

export async function fetchAuthed(path: string, init?: RequestInit): Promise<Response> {
  const cookieStore = await cookies();
  const res = await fetch(`${AI_SERVICE_URL}/api${path}`, {
    ...init,
    headers: { ...(init?.headers ?? {}), Cookie: cookieStore.toString() },
    cache: "no-store"
  });

  if (res.status === 401) {
    redirect("/sign-in");
  }
  return res;
}

export async function fetchPublic(path: string, init?: RequestInit): Promise<Response> {
  return fetch(`${AI_SERVICE_URL}/api${path}`, { ...init, cache: "no-store" });
}
