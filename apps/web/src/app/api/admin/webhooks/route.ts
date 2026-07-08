import { requireAdmin } from "@/lib/auth/guards";
import { handleGestorRouteError } from "@/lib/gestor/api-handler";
import { apiSuccess } from "@/lib/api-response";
import { parseGestorFilters } from "@/lib/gestor/gestor-filters";
import { getAdminWebhooksModule } from "@/lib/platform/integration-automation-service";

export async function GET(request: Request) {
  const { error } = await requireAdmin({ path: "/api/admin/webhooks" });
  if (error) return error;
  try {
    const filters = parseGestorFilters(new URL(request.url).searchParams);
    return apiSuccess(await getAdminWebhooksModule(filters));
  } catch (e) {
    return handleGestorRouteError(e);
  }
}
