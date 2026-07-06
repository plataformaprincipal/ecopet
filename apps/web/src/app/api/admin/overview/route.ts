import { apiSuccess, apiFailure } from "@/lib/api-response";
import { requireAdmin } from "@/lib/admin/require-admin";
import { getAdminDashboardMetrics } from "@/lib/admin/metrics-service";

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  const metrics = await getAdminDashboardMetrics();
  return apiSuccess({ metrics });
}
