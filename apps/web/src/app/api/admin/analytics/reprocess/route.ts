import { AnalyticsServerService } from "@/lib/analytics/server";
import { withAnalyticsAdminRoute, apiSuccess } from "@/lib/analytics/server/http";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  return withAnalyticsAdminRoute(
    request,
    {
      rateKey: "reprocess",
      limit: 10,
      auditResource: "analytics-reprocess",
      auditAction: "UPDATE",
    },
    async () => {
      let limit = 10;
      try {
        const body = await request.json();
        if (body?.limit) limit = Number(body.limit) || 10;
      } catch {
        /* empty body ok */
      }
      return apiSuccess(await AnalyticsServerService.reprocess(limit));
    }
  );
}
