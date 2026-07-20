import { AnalyticsServerService } from "@/lib/analytics/server";
import { withAnalyticsAdminRoute, apiSuccess } from "@/lib/analytics/server/http";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  return withAnalyticsAdminRoute(
    request,
    { rateKey: "metrics", auditResource: "analytics-metrics" },
    async () => apiSuccess(await AnalyticsServerService.metrics())
  );
}
