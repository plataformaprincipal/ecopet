import { AnalyticsServerService, getGoogleAnalyticsAdminDiagnostics } from "@/lib/analytics/server";
import { withAnalyticsAdminRoute, apiSuccess } from "@/lib/analytics/server/http";

export const dynamic = "force-dynamic";

/**
 * GET — diagnóstico ADMIN GA4 (compat + ops enterprise).
 * Mantém contrato legado e enriquece com health/cache/fila.
 */
export async function GET(request: Request) {
  return withAnalyticsAdminRoute(
    request,
    {
      rateKey: "ga-integrations-diag",
      limit: 20,
      auditResource: "google-analytics-diagnostics",
    },
    async () => {
      const legacy = getGoogleAnalyticsAdminDiagnostics();
      const ops = await AnalyticsServerService.diagnostics({ persist: true });
      return apiSuccess({
        ...legacy,
        backend: {
          version: ops.version,
          health: ops.health,
          cache: ops.cache,
          queue: ops.queue,
          dataApiStatus: ops.dataApiStatus,
          propertyIdMasked: ops.propertyIdMasked,
          catalogEventCount: ops.catalogEventCount,
          responseMs: ops.responseMs,
          ops: ops.ops,
        },
      });
    }
  );
}
