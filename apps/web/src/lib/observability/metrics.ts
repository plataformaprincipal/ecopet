import { logStructured } from "./logger";
import { isObservabilityFlagEnabled } from "./config";

/**
 * Métricas como eventos estruturados (OTLP metrics: interface — ver docs).
 * Evita cardinalidade alta: sem userId em labels.
 */
export function trackMetric(
  name: string,
  value: number,
  labels: Record<string, string | number | boolean | undefined> = {}
) {
  if (!isObservabilityFlagEnabled("metrics") && !isObservabilityFlagEnabled("observability")) {
    return;
  }

  const safeLabels: Record<string, string | number | boolean> = {};
  for (const [k, v] of Object.entries(labels)) {
    if (v === undefined) continue;
    if (/user|email|token|secret/i.test(k)) continue;
    safeLabels[k] = v;
  }

  logStructured("info", `metric:${name}`, {
    event: "metric",
    metricName: name,
    metricValue: value,
    ...safeLabels,
  });
}

export const MetricNames = {
  REQUESTS_TOTAL: "requests_total",
  REQUEST_DURATION_MS: "request_duration_ms",
  REQUEST_ERRORS_TOTAL: "request_errors_total",
  RATE_LIMIT_HITS: "rate_limit_hits",
  AUTH_FAILURES: "authentication_failures",
  AUTH_DENIALS: "authorization_denials",
  VALIDATION_FAILURES: "validation_failures",
  UNHANDLED_ERRORS: "unhandled_errors",
  DEPENDENCY_FAILURES: "dependency_failures",
  AI_REQUESTS: "ai_requests_total",
  AI_DURATION_MS: "ai_request_duration_ms",
  AI_TOKENS_IN: "ai_tokens_input",
  AI_TOKENS_OUT: "ai_tokens_output",
  AI_ERRORS: "ai_errors",
  TALKJS_WEBHOOKS: "talkjs_webhook_events",
  PAYMENT_WEBHOOKS: "payment_webhooks",
  WEBHOOKS_TOTAL: "webhooks_total",
  PUSH_SENT: "push_sent",
  PUSH_FAILED: "push_failed",
  EMAILS_SENT: "emails_sent",
  EMAILS_FAILED: "emails_failed",
  EMAIL_LATENCY_MS: "email_latency",
  UPLOADS: "uploads",
  UPLOAD_FAILURES: "upload_failures",
  PRISMA_DURATION_MS: "prisma_query_duration_ms",
  PRISMA_ERRORS: "prisma_query_errors",
} as const;
