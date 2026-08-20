import { apiSuccess } from "@/lib/api-response";
import { requireAdmin } from "@/lib/auth/guards";
import { scanFinanceOpsAlerts } from "@/lib/finance/ops-alerts";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { error } = await requireAdmin({ path: "/api/admin/financeiro/alerts" });
  if (error) return error;
  const url = new URL(req.url);
  const lookbackHours = Number(url.searchParams.get("lookbackHours") || 48);
  const result = await scanFinanceOpsAlerts({ lookbackHours });
  return apiSuccess(result);
}
