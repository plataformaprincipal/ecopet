import { apiSuccess, apiFailure } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/** Readiness — depende do banco. */
export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return apiSuccess({
      status: "ready",
      check: "ready",
      database: "ok",
      ts: new Date().toISOString(),
    });
  } catch {
    return apiFailure("NOT_READY", "Banco indisponível.", 503);
  }
}
