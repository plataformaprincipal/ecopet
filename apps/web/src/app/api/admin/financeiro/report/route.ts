import { apiSuccess } from "@/lib/api-response";
import { requireAdmin } from "@/lib/auth/guards";
import { buildFinancialReport } from "@/lib/finance/reporting";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { error } = await requireAdmin({ path: "/api/admin/financeiro/report" });
  if (error) return error;
  const url = new URL(req.url);
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");
  const report = await buildFinancialReport({
    from: from ? new Date(from) : undefined,
    to: to ? new Date(to) : undefined,
  });
  return apiSuccess(report);
}
