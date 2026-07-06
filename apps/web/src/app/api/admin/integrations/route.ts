import { apiSuccess } from "@/lib/api-response";
import { requireAdmin } from "@/lib/admin/require-admin";
import { getAdminIntegrationsModule } from "@/lib/admin/dashboard-service";
import { handleGestorRouteError } from "@/lib/gestor/api-handler";

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;
  try {
    const data = await getAdminIntegrationsModule();
    return apiSuccess(data);
  } catch (e) {
    return handleGestorRouteError(e);
  }
}
