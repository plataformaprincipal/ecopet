import { apiSuccess, apiFailure } from "@/lib/api-response";
import { requireAdmin } from "@/lib/auth/guards";
import {
  getObservabilityHealthSnapshot,
  isObservabilityFlagEnabled,
} from "@/lib/observability/config";
import { getTransportStats } from "@/lib/observability/better-stack-transport";
import { getObservabilityProviders } from "@/lib/observability/providers";

export const dynamic = "force-dynamic";

/**
 * Diagnóstico interno — admin only.
 * Não expõe tokens, URLs com credenciais ou stacks.
 */
export async function GET(request: Request) {
  const { error } = await requireAdmin({ path: new URL(request.url).pathname });
  if (error) return error;

  if (!isObservabilityFlagEnabled("adminObservability")) {
    return apiFailure("DISABLED", "Admin observability desativado.", 503);
  }

  const health = getObservabilityHealthSnapshot();
  const transport = getTransportStats();
  const providers = getObservabilityProviders();

  return apiSuccess({
    environment: health.environment,
    service: health.serviceName,
    release: health.release,
    betterStack: {
      configured: health.configured,
      hostPreview: health.hostPreview,
      sourceIdPreview: health.sourceIdPreview,
      region: health.region,
      tokenConfigured: health.tokenConfigured,
      transport,
    },
    otel: {
      configured: health.otelConfigured,
      tracingFunctional: health.tracingFunctional,
    },
    flags: health.flags,
    providers,
    limitations: {
      sessionReplay: false,
      dashboardsExternal: true,
      alertsExternal: true,
    },
  });
}
