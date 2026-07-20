import { apiSuccess, apiFailure } from "@/lib/api-response";
import { requireAdmin } from "@/lib/auth/guards";
import { checkRateLimit } from "@/lib/rate-limit";
import { getProductionReadinessReport } from "@/lib/admin/production";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/production/status
 * Relatório agregado de prontidão para produção (ADMIN).
 */
export async function GET() {
  const { user, error } = await requireAdmin({ path: "/api/admin/production/status" });
  if (error) return error;

  if (!checkRateLimit(`admin-production-status:${user!.id}`, 20, 60_000)) {
    return apiFailure("RATE_LIMIT", "Limite de requisições.", 429);
  }

  try {
    const report = await getProductionReadinessReport();
    return apiSuccess(report);
  } catch (e) {
    return apiFailure(
      "INTERNAL",
      e instanceof Error ? e.message : "Falha no relatório de produção.",
      500
    );
  }
}
