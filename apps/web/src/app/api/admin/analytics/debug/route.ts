import { AnalyticsServerService } from "@/lib/analytics/server";
import { withAnalyticsAdminRoute, apiSuccess } from "@/lib/analytics/server/http";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  return withAnalyticsAdminRoute(
    request,
    { rateKey: "debug", limit: 20, auditResource: "analytics-debug" },
    async () => apiSuccess(await AnalyticsServerService.debug())
  );
}
