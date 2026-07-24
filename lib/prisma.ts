// lib/prisma.ts
//
// Client Prisma en singleton : en dev, Next.js recharge les modules à chaud
// (HMR) sans redémarrer le process Node, ce qui recréerait un nouveau
// PrismaClient — et donc une nouvelle connexion DB — à chaque sauvegarde
// sans ce cache sur `globalThis`.

import { PrismaClient } from "./generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL ?? "file:./dev.db",
});

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
