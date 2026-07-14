import { apiSuccess } from "@/lib/api-response";
import { requireAdmin } from "@/lib/auth/guards";
import { getAllIntegrationStatuses } from "@/lib/integrations/integration-status";
import { toIntegrationApiFailure } from "@/lib/integrations/integration-errors";

/**
 * GET /api/admin/integrations/status
 * Retorna status Phase 1 de provedores (sem secrets).
 */
export async function GET() {
  const { error } = await requireAdmin({ path: "/api/admin/integrations/status" });
  if (error) return error;

  try {
    const integrations = getAllIntegrationStatuses();
    return apiSuccess({ integrations });
  } catch (e) {
    return toIntegrationApiFailure(e);
  }
}
