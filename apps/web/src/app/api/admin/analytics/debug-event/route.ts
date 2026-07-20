import { AnalyticsServerService } from "@/lib/analytics/server";
import { withAnalyticsAdminRoute, apiSuccess, apiFailure } from "@/lib/analytics/server/http";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  return withAnalyticsAdminRoute(
    request,
    {
      rateKey: "debug-event",
      limit: 20,
      auditResource: "analytics-debug-event",
      auditAction: "CREATE",
    },
    async () => {
      let body: { name?: string; params?: Record<string, unknown>; dryRun?: boolean };
      try {
        body = await request.json();
      } catch {
        return apiFailure("VALIDATION", "JSON inválido.", 400);
      }
      if (!body.name) return apiFailure("VALIDATION", "name é obrigatório.", 400);
      const result = await AnalyticsServerService.debugEvent({
        name: body.name,
        params: body.params,
        dryRun: body.dryRun !== false,
      });
      if (!result.accepted) {
        return apiFailure("VALIDATION", result.reason ?? "Evento rejeitado.", 400);
      }
      return apiSuccess(result);
    }
  );
}
