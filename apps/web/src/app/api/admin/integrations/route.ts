import { apiFailure, apiSuccess } from "@/lib/api-response";
import { requireAdmin } from "@/lib/auth/guards";
import { parseGestorFilters } from "@/lib/gestor/gestor-filters";
import { handleGestorRouteError } from "@/lib/gestor/api-handler";
import { getIntegrationHealthSummary, listGlobalIntegrations } from "@/lib/integrations/integration-registry-erp";
import { getRecentIntegrationLogs } from "@/lib/integrations/log";
import { seedAutomationTemplates } from "@/lib/platform/integration-automation-service";

export async function GET(request: Request) {
  const { error } = await requireAdmin({ path: "/api/admin/integrations" });
  if (error) return error;
  try {
    const filters = parseGestorFilters(new URL(request.url).searchParams);
    const tab = new URL(request.url).searchParams.get("tab");
    if (tab === "health") {
      return apiSuccess(await getIntegrationHealthSummary());
    }
    if (tab === "logs") {
      const logs = await getRecentIntegrationLogs(filters.limit);
      return apiSuccess({ items: logs });
    }
    const items = await listGlobalIntegrations();
    return apiSuccess({ items, filters });
  } catch (e) {
    return handleGestorRouteError(e);
  }
}

export async function POST(request: Request) {
  const { user, error } = await requireAdmin({ path: "/api/admin/integrations" });
  if (error) return error;
  try {
    await seedAutomationTemplates();
    return apiSuccess({ seeded: true, by: user!.id });
  } catch (e) {
    return handleGestorRouteError(e);
  }
}
