// Wrapper fetch cote navigateur (Client Components uniquement - ce n'est pas
// du backend, juste de la gestion d'erreur UI). Sans middleware Next.js pour
// verifier le JWT (voir le refacto : zero logique d'auth cote Node), chaque
// appel protege reagit lui-meme a un 401 en renvoyant vers /sign-in.

export async function apiFetch(path: string, init?: RequestInit): Promise<Response> {
  const res = await fetch(path, init);
  if (res.status === 401 && typeof window !== "undefined") {
    window.location.href = `/sign-in?redirectTo=${encodeURIComponent(window.location.pathname)}`;
  }
  return res;
}
