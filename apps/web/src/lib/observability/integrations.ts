/**
 * Telemetria de integrações — sem payload sensível.
 * Único ponto para OpenAI, TalkJS, Mercado Pago, Firebase, Cloudinary, Resend, Maps, Prisma.
 */
import { isObservabilityFlagEnabled } from "./config";
import { logStructured } from "./logger";
import { trackMetric, MetricNames } from "./metrics";
import { captureError } from "./error-capture";
import { sanitizeErrorMessage } from "./redaction";

export type IntegrationName =
  | "openai"
  | "talkjs"
  | "mercado_pago"
  | "firebase"
  | "cloudinary"
  | "resend"
  | "google_maps"
  | "supabase"
  | "prisma"
  | "webhook";

export async function observeIntegrationCall<T>(
  integration: IntegrationName,
  operation: string,
  fn: () => Promise<T>,
  extra: Record<string, string | number | boolean | undefined> = {}
): Promise<T> {
  if (!isObservabilityFlagEnabled("integrationTelemetry")) {
    return fn();
  }

  const started = Date.now();
  try {
    const result = await fn();
    const durationMs = Date.now() - started;
    logStructured("info", `${integration}.${operation}`, {
      module: integration,
      event: "integration.success",
      action: operation,
      integration,
      durationMs,
      ...extra,
    });
    trackMetric(`${integration}_latency_ms`, durationMs, { operation });
    return result;
  } catch (error) {
    const durationMs = Date.now() - started;
    captureError(error, {
      module: integration,
      integration,
      action: operation,
      durationMs,
      ...extra,
    });
    trackMetric(MetricNames.DEPENDENCY_FAILURES, 1, { integration, operation });
    throw error;
  }
}

export function recordIntegrationEvent(
  integration: IntegrationName,
  event: string,
  fields: Record<string, string | number | boolean | undefined> = {}
) {
  if (!isObservabilityFlagEnabled("integrationTelemetry")) return;
  logStructured("info", event, {
    module: integration,
    event,
    integration,
    ...fields,
  });
}

export function recordWebhookTelemetry(input: {
  provider: string;
  eventType: string;
  outcome: "accepted" | "rejected" | "duplicate" | "failed" | "processed";
  durationMs?: number;
  statusCode?: number;
  errorCode?: string;
}) {
  if (!isObservabilityFlagEnabled("integrationTelemetry")) return;

  const metric =
    input.provider === "talkjs"
      ? MetricNames.TALKJS_WEBHOOKS
      : input.provider.includes("mercado") || input.provider === "mercado_pago"
        ? MetricNames.PAYMENT_WEBHOOKS
        : MetricNames.WEBHOOKS_TOTAL;

  trackMetric(metric, 1, {
    provider: input.provider,
    outcome: input.outcome,
  });

  logStructured(
    input.outcome === "failed" || input.outcome === "rejected" ? "warn" : "info",
    `webhook.${input.provider}.${input.outcome}`,
    {
      module: "webhooks",
      event: "webhook.processed",
      integration: input.provider,
      action: input.eventType.slice(0, 80),
      statusCode: input.statusCode,
      durationMs: input.durationMs,
      errorCode: input.errorCode ? sanitizeErrorMessage(input.errorCode).slice(0, 80) : undefined,
      outcome: input.outcome,
    }
  );
}

/** Prisma: duração + modelo + operação — sem SQL/params. */
export async function observePrismaOperation<T>(
  model: string,
  operation: string,
  fn: () => Promise<T>
): Promise<T> {
  if (!isObservabilityFlagEnabled("databaseTracing")) {
    return fn();
  }
  return observeIntegrationCall("prisma", `${model}.${operation}`, fn, { model, operation });
}
