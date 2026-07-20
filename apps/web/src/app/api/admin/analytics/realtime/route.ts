import { AnalyticsServerService } from "@/lib/analytics/server";
import { withAnalyticsAdminRoute, apiSuccess } from "@/lib/analytics/server/http";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  return withAnalyticsAdminRoute(
    request,
    { rateKey: "realtime", limit: 15, auditResource: "analytics-realtime" },
    async () => apiSuccess(await AnalyticsServerService.realtime())
  );
}
