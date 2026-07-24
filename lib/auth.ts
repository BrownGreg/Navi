// lib/auth.ts
//
// Choix : JWT stocké dans un cookie httpOnly, plutôt qu'une session
// serveur classique (ex. store Redis).
//
// Pourquoi :
// - Next.js middleware (protection des pages) tourne par défaut sur le
//   Edge runtime, qui n'a pas accès aux API Node classiques. `jose`
//   fonctionne sur Edge (contrairement à `jsonwebtoken`, qui utilise le
//   module `crypto` de Node) — on peut donc vérifier la session
//   directement dans le middleware, sans aller interroger la base à
//   chaque requête.
// - Pas d'infra supplémentaire à gérer (pas de Redis/store de sessions)
//   pour un projet de cette taille.
// - Limite assumée : un JWT ne peut pas être révoqué instantanément
//   côté serveur avant son expiration. Mitigé ici par une durée de vie
//   courte (7 jours) — acceptable pour le socle du projet, à documenter
//   comme limite connue dans le rapport technique.
//
// Le cookie est httpOnly + secure + sameSite=lax : inaccessible en JS
// côté client (protection XSS), non envoyé en cross-site (protection
// CSRF basique).

import { SignJWT, jwtVerify } from "jose";

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error("JWT_SECRET manquant dans les variables d'environnement");
}
const secretKey = new TextEncoder().encode(JWT_SECRET);

const SESSION_DURATION = "7d";
export const SESSION_COOKIE_NAME = "scribe_session";

export type SessionPayload = {
  userId: string;
  email: string;
};

export async function signSession(payload: SessionPayload): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(SESSION_DURATION)
    .sign(secretKey);
}

export async function verifySession(
  token: string
): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey);
    if (typeof payload.userId !== "string" || typeof payload.email !== "string") {
      return null;
    }
    return { userId: payload.userId, email: payload.email };
  } catch {
    // Token invalide, expiré, ou signature incorrecte
    return null;
  }
}
