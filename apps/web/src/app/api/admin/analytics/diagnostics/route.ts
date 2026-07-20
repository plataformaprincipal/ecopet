import { AnalyticsServerService } from "@/lib/analytics/server";
import { withAnalyticsAdminRoute, apiSuccess } from "@/lib/analytics/server/http";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const persist = url.searchParams.get("persist") === "1";
  const skipCache = url.searchParams.get("fresh") === "1";
  return withAnalyticsAdminRoute(
    request,
    { rateKey: "diagnostics", limit: 20, auditResource: "analytics-diagnostics" },
    async () =>
      apiSuccess(
        await AnalyticsServerService.diagnostics({
          persist,
          skipCache,
        })
      )
  );
}
