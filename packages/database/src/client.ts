import { PrismaClient } from "@prisma/client";
import { logDatabaseBootDiagnostics } from "./diagnostics";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

function augmentDatabaseUrlForServerless(raw: string): string {
  if (process.env.VERCEL !== "1") return raw;

  let url = raw;
  const append = (param: string, value: string) => {
    if (new RegExp(`[?&]${param}=`, "i").test(url)) return;
    url += `${url.includes("?") ? "&" : "?"}${param}=${value}`;
  };

  append("connection_limit", "1");
  append("sslmode", "require");
  return url;
}

function resolveDatasourceUrl(): string | undefined {
  const raw = process.env.DATABASE_URL?.trim();
  if (!raw) return undefined;
  return augmentDatabaseUrlForServerless(raw);
}

export function createPrismaClient(): PrismaClient {
  const rawUrl = process.env.DATABASE_URL?.trim();
  const url = resolveDatasourceUrl();
  logDatabaseBootDiagnostics(rawUrl, url);

  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    ...(url ? { datasources: { db: { url } } } : {}),
  });
}

export function getResolvedDatabaseUrl(): string | undefined {
  return resolveDatasourceUrl();
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
