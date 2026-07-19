import { apiFailure, apiSuccess } from "@/lib/api-response";
import { runMercadoPagoWebhookPipeline } from "@/lib/mercado-pago/webhooks/pipeline";

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
export async function POST(request: Request) {
  if (request.method !== "POST") {
    return apiFailure("METHOD_NOT_ALLOWED", "Método não permitido.", 405);
  }

  const contentLength = Number(request.headers.get("content-length") || "0");
  if (contentLength > 256_000) {
    return apiFailure("PAYLOAD_TOO_LARGE", "Payload excede o limite.", 413);
  }

  const rawBody = await request.text();
  const result = await runMercadoPagoWebhookPipeline({
    rawBody,
    headers: request.headers,
  });

  if (!result.ok) {
    return apiFailure(result.code, "Webhook rejeitado.", result.status);
  }

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
