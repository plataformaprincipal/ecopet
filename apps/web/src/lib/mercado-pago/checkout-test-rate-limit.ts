import "server-only";
import { prisma } from "@/lib/prisma";

/** Conservative, atomic, multi-instance, fail-closed TEST limit. Existing table. */
export async function checkCheckoutTestRateLimit(key: string, limit: number, windowMs: number): Promise<boolean> {
  try {
    return await prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(741904, hashtext(${key}))`;
      const now = new Date();
      const bucket = await tx.rateLimitBucket.findUnique({ where: { id: key } });
      if (!bucket || bucket.resetAt <= now) {
        await tx.rateLimitBucket.upsert({ where: { id: key }, create: { id: key, count: 1, resetAt: new Date(+now + windowMs) }, update: { count: 1, resetAt: new Date(+now + windowMs) } });
        return true;
      }
      if (bucket.count >= limit) return false;
      await tx.rateLimitBucket.update({ where: { id: key }, data: { count: { increment: 1 } } });
      return true;
    });
  } catch {
    return false;
  }
}
