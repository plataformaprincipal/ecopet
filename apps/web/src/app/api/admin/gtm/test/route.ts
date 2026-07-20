import { withGtmAdminRoute, apiSuccess, apiFailure } from "@/lib/server/gtm/http";
import { getGtmOpsConfig } from "@/lib/server/gtm";
import { detectGtmEnvironment } from "@/lib/gtm/config";
import { newEventId } from "@/lib/gtm/session";
import { GTM_EVENT_VERSION } from "@/lib/gtm/contract";

export const dynamic = "force-dynamic";

/**
 * POST — gera comprovante de teste (não dispara gtag automaticamente no server).
 * Frontend/admin deve empurrar ao Data Layer apenas em modo autorizado.
 */
export async function POST(request: Request) {
  return withGtmAdminRoute(
    request,
    {
      rateKey: "test",
      limit: 8,
      auditResource: "gtm-test",
      auditAction: "CREATE",
    },
    async () => {
      const env = detectGtmEnvironment();
      const config = await getGtmOpsConfig();
      if (env === "production" && !config.flags.allowProductionTest) {
        return apiFailure(
          "FORBIDDEN",
          "Teste em production exige allowProductionTest na config operacional.",
          403
        );
      }

      const eventId = newEventId();
      return apiSuccess({
        event: "gtm_integration_test",
        event_id: eventId,
        module: "admin",
        environment: env,
        event_version: GTM_EVENT_VERSION,
        timestamp: new Date().toISOString(),
        test_mode: true,
        instructions: [
          "No browser admin, chame pushTelemetryEvent com este payload (ou use console).",
          "Valide no GTM Preview o Custom Event gtm_integration_test / espelho.",
          "Não contém PII nem user_id.",
        ],
      });
    }
  );
}
