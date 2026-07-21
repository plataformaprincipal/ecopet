import { z } from "zod";
import { NextResponse } from "next/server";
import { apiSuccess, apiFailure } from "@/lib/api-response";
import { checkAuthRateLimit } from "@/lib/rate-limit";
import { isObservabilityFlagEnabled } from "@/lib/observability/config";
import { logStructured } from "@/lib/observability/logger";
import { sanitizeErrorMessage, newCorrelationId, isValidCorrelationId } from "@/lib/observability/redaction";
import { trackMetric, MetricNames } from "@/lib/observability/metrics";

export const dynamic = "force-dynamic";

const schema = z.object({
  name: z.string().min(1).max(120),
  message: z.string().min(1).max(500),
  stack: z.string().max(2000).optional(),
  route: z.string().max(300).optional(),
  digest: z.string().max(120).optional(),
  release: z.string().max(80).optional(),
  correlationId: z.string().max(64).optional(),
});

/**
 * Erros do browser → servidor → Better Stack.
 * Nunca aceita token nem campos livres ilimitados.
 */
export async function POST(request: Request) {
  if (!isObservabilityFlagEnabled("clientErrorReporting")) {
    return apiFailure("DISABLED", "Client error reporting desativado.", 503);
  }

  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";

  if (!checkAuthRateLimit(`telemetry:client-error:${ip}`, 20, 60_000)) {
    trackMetric(MetricNames.RATE_LIMIT_HITS, 1, { endpoint: "client-error" });
    return apiFailure("RATE_LIMIT", "Muitas requisições.", 429);
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return apiFailure("VALIDATION", "Payload inválido.", 400);
  }

  // Reject oversized raw
  const rawSize = JSON.stringify(body).length;
  if (rawSize > 8_000) {
    return apiFailure("VALIDATION", "Payload excessivo.", 413);
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return apiFailure("VALIDATION", "Campos inválidos.", 400);
  }

  const correlationId = isValidCorrelationId(parsed.data.correlationId)
    ? parsed.data.correlationId!
    : newCorrelationId();

  logStructured("error", sanitizeErrorMessage(parsed.data.message), {
    module: "frontend",
    event: "client.error",
    action: "report",
    errorType: parsed.data.name,
    route: parsed.data.route,
    correlationId,
    digest: parsed.data.digest,
    release: parsed.data.release,
    stackPreview: parsed.data.stack
      ? sanitizeErrorMessage(parsed.data.stack).split("\n").slice(0, 6).join("\n")
      : undefined,
    source: "browser",
  });

  trackMetric(MetricNames.REQUEST_ERRORS_TOTAL, 1, { module: "frontend" });

  const res = apiSuccess({ received: true, correlationId });
  res.headers.set("x-correlation-id", correlationId);
  return res;
}

export async function GET() {
  return NextResponse.json({ ok: true, endpoint: "client-error" });
}
