import { z } from "zod";
import { apiSuccess, apiFailure } from "@/lib/api-response";
import { requireAdmin } from "@/lib/auth/guards";
import {
  getObservabilityHealthSnapshot,
  isObservabilityFlagEnabled,
} from "@/lib/observability/config";
import { getTransportStats } from "@/lib/observability/better-stack-transport";
import { getObservabilityProviders } from "@/lib/observability/providers";
import { logStructured } from "@/lib/observability/logger";
import { newCorrelationId } from "@/lib/observability/redaction";

export const dynamic = "force-dynamic";

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
    health,
    transport,
    providers,
    limitations: {
      sessionReplay: false,
      sentryRemoved: true,
      tracing:
        health.tracingFunctional
          ? "OTLP endpoint configurado"
          : "Interface pronta — ative OBS_FLAG_TRACING + OTEL_EXPORTER_OTLP_ENDPOINT",
      dashboards: "Configurar manualmente no painel Better Stack",
      alerts: "Configurar manualmente no painel Better Stack / Uptime",
    },
  });
}

const testSchema = z.object({
  confirm: z.literal(true),
});

/** Evento de teste controlado — só admin. */
export async function POST(request: Request) {
  const { user, error } = await requireAdmin({ path: new URL(request.url).pathname });
  if (error || !user) return error!;

  if (!isObservabilityFlagEnabled("adminObservability")) {
    return apiFailure("DISABLED", "Admin observability desativado.", 503);
  }

  const body = await request.json().catch(() => ({}));
  const parsed = testSchema.safeParse(body);
  if (!parsed.success) {
    return apiFailure("VALIDATION", "Envie { confirm: true }.", 400);
  }

  const correlationId = newCorrelationId();
  logStructured("info", "observability.test_event", {
    module: "observability",
    event: "observability.test",
    action: "admin_test",
    correlationId,
    test: true,
  });

  return apiSuccess({
    sent: true,
    correlationId,
    message: "Evento de teste enfileirado. Verifique Live tail no Better Stack.",
  });
}
