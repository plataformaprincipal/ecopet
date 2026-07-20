import { AnalyticsServerService } from "@/lib/analytics/server";
import { withAnalyticsAdminRoute, apiSuccess } from "@/lib/analytics/server/http";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  return withAnalyticsAdminRoute(
    request,
    {
      rateKey: "test",
      limit: 10,
      auditResource: "analytics-test",
      auditAction: "CREATE",
    },
    async () => apiSuccess(await AnalyticsServerService.testProbe())
  );
}
