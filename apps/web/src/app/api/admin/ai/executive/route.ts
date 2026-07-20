import { apiSuccess } from "@/lib/api-response";
import { requireAdmin } from "@/lib/auth/guards";
import { getExecutiveAiDashboard } from "@/lib/ai/enterprise/executive-dashboard";
import { evaluateAiProductionReadiness } from "@/lib/ai/enterprise/production-readiness";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { error } = await requireAdmin({
    path: new URL(request.url).pathname,
  });
  if (error) return error;

  const [dashboard, readiness] = await Promise.all([
    getExecutiveAiDashboard(),
    evaluateAiProductionReadiness(),
  ]);

  return apiSuccess({ dashboard, readiness });
}
