import { apiSuccess, apiFailure } from "@/lib/api-response";
import { requireAdmin } from "@/lib/admin/require-admin";
import { getAdminExecutiveDashboard } from "@/lib/admin/dashboard-service";

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  const data = await getAdminExecutiveDashboard({ page: 1, limit: 20 });
  return apiSuccess({ metrics: data.metrics, tables: data.tables, quickActions: data.quickActions });
}
