// lib/password.ts
//
// bcryptjs plutôt que bcrypt : implémentation pure JS, pas de binaire
// natif à compiler — évite les problèmes cross-plateforme (Windows/WSL/
// Docker) qu'on a déjà rencontrés sur ce projet avec d'autres paquets.

import bcrypt from "bcryptjs";

const SALT_ROUNDS = 12;

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, SALT_ROUNDS);
}

export async function verifyPassword(
  plain: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}
