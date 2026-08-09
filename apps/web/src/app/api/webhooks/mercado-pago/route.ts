import { apiFailure, apiSuccess } from "@/lib/api-response";
import { runMercadoPagoWebhookPipeline } from "@/lib/mercado-pago/webhooks/pipeline";
import { extractMercadoPagoWebhookQuery } from "@/lib/mercado-pago/webhook-query";
import { withApiTelemetry } from "@/lib/observability/with-api-telemetry";
import { recordWebhookTelemetry } from "@/lib/observability/integrations";
import { captureSecurityEvent } from "@/lib/observability/error-capture";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET — health (não exige webhook cadastrado). */
export async function GET() {
  return apiSuccess({
    status: "ok",
    provider: "mercado_pago",
    path: "/api/webhooks/mercado-pago",
    multiTopic: true,
    note: "Cadastre esta URL no painel Mercado Pago. Futuro: https://eccopet.com/api/webhooks/mercado-pago",
  });
}

/**
 * POST /api/webhooks/mercado-pago
 * Multi-tópico: Order, payment, fraude, claims, chargebacks, etc.
 */
async function mercadoPagoWebhookHandler(request: Request) {
  const started = Date.now();
  if (request.method !== "POST") {
    return apiFailure("METHOD_NOT_ALLOWED", "Método não permitido.", 405);
  }

  const contentLength = Number(request.headers.get("content-length") || "0");
  if (contentLength > 256_000) {
    return apiFailure("PAYLOAD_TOO_LARGE", "Payload excede o limite.", 413);
  }

  const rawBody = await request.text();
  // Docs MP Orders: data.id para assinatura vem da query (?data.id=...).
  const query = extractMercadoPagoWebhookQuery(request.url);

  const result = await runMercadoPagoWebhookPipeline({
    rawBody,
    headers: request.headers,
    query,
  });

  if (!result.ok) {
    if (String(result.code).includes("SIGNATURE")) {
      captureSecurityEvent("webhook_invalid_signature", { provider: "mercado_pago" });
    }
    recordWebhookTelemetry({
      provider: "mercado_pago",
      eventType: result.code,
      outcome: "rejected",
      durationMs: Date.now() - started,
      statusCode: result.status,
      errorCode: result.code,
    });
    return apiFailure(result.code, "Webhook rejeitado.", result.status);
  }

  recordWebhookTelemetry({
    provider: "mercado_pago",
    eventType: result.code,
    outcome: result.duplicate ? "duplicate" : "processed",
    durationMs: Date.now() - started,
    statusCode: result.status === 201 ? 201 : 200,
  });

  return apiSuccess(
    {
      received: true,
      code: result.code,
      duplicate: Boolean(result.duplicate),
      id: result.webhookEventId,
    },
    result.status === 201 ? 201 : 200
  );
}

export const POST = withApiTelemetry("mercado_pago", mercadoPagoWebhookHandler);
