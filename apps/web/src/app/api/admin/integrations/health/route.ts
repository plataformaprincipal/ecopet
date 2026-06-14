import { apiSuccess } from "@/lib/api-response";
import { requireAdmin } from "@/lib/admin/require-admin";
import { getIntegrationHealthReport } from "@/lib/integrations/health";

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  const report = await getIntegrationHealthReport();
  return apiSuccess({ health: report });
}
