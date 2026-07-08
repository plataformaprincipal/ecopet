import { requireAdmin } from "@/lib/auth/guards";
import { handleGestorRouteError } from "@/lib/gestor/api-handler";
import { apiSuccess } from "@/lib/api-response";
import { getIntegrationHealthSummary } from "@/lib/integrations/integration-registry";

export async function GET() {
  const { error } = await requireAdmin({ path: "/api/admin/integrations/health" });
  if (error) return error;
  try {
    return apiSuccess(await getIntegrationHealthSummary());
  } catch (e) {
    return handleGestorRouteError(e);
  }
}
