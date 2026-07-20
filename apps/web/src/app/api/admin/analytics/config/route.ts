import { AnalyticsServerService } from "@/lib/analytics/server";
import { validateConfigFlags } from "@/lib/analytics/server";
import { withAnalyticsAdminRoute, apiSuccess, apiFailure } from "@/lib/analytics/server/http";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  return withAnalyticsAdminRoute(
    request,
    { rateKey: "config-get", auditResource: "analytics-config" },
    async () => apiSuccess(await AnalyticsServerService.config())
  );
}

export async function PATCH(request: Request) {
  return withAnalyticsAdminRoute(
    request,
    {
      rateKey: "config-patch",
      limit: 15,
      auditResource: "analytics-config",
      auditAction: "UPDATE",
    },
    async ({ userId }) => {
      let body: unknown;
      try {
        body = await request.json();
      } catch {
        return apiFailure("VALIDATION", "JSON inválido.", 400);
      }
      const flags = (body as { flags?: unknown })?.flags ?? body;
      const validated = validateConfigFlags(flags);
      if (!validated.ok || !validated.flags) {
        return apiFailure("VALIDATION", validated.error ?? "Flags inválidas.", 400);
      }
      const updated = await AnalyticsServerService.patchConfig(validated.flags, userId);
      return apiSuccess(updated);
    }
  );
}
