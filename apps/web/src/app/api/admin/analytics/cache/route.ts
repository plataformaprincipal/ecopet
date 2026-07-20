import { AnalyticsServerService } from "@/lib/analytics/server";
import { withAnalyticsAdminRoute, apiSuccess } from "@/lib/analytics/server/http";

export const dynamic = "force-dynamic";

export async function DELETE(request: Request) {
  return withAnalyticsAdminRoute(
    request,
    {
      rateKey: "cache-delete",
      limit: 15,
      auditResource: "analytics-cache",
      auditAction: "DELETE",
    },
    async () => {
      const url = new URL(request.url);
      const prefix = url.searchParams.get("prefix") ?? undefined;
      return apiSuccess(await AnalyticsServerService.clearCache(prefix));
    }
  );
}
