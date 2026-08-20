import { PrismaClient } from "@prisma/client";
import { loadWebRuntimeEnv } from "./load-web-env";

loadWebRuntimeEnv();

const prisma = new PrismaClient({
  datasources: process.env.DATABASE_URL ? { db: { url: process.env.DATABASE_URL } } : undefined,
});

/** Limpa buckets distribuídos de auth para suites E2E locais. */
export async function clearAuthRateLimitBuckets() {
  await prisma.rateLimitBucket.deleteMany({
    where: { id: { startsWith: "login:" } },
  });
  await prisma.rateLimitBucket.deleteMany({
    where: { id: { startsWith: "register:" } },
  });
}
