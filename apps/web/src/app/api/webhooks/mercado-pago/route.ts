import { apiFailure, apiSuccess } from "@/lib/api-response";
import { processMercadoPagoWebhook } from "@/lib/mercado-pago/process-webhook";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET — health check (não exige webhook cadastrado). */
export async function GET() {
  return apiSuccess({
    status: "ok",
    provider: "mercado_pago",
    path: "/api/webhooks/mercado-pago",
    note: "Cadastre esta URL no painel Mercado Pago quando o domínio estiver disponível.",
  });
}

/**
 * POST /api/webhooks/mercado-pago
 * Futuro: https://eccopet.com/api/webhooks/mercado-pago
 * Não marca pago só pelo payload — consulta API Orders server-side.
 */
export async function POST(request: Request) {
  const contentLength = Number(request.headers.get("content-length") || "0");
  if (contentLength > 256_000) {
    return apiFailure("PAYLOAD_TOO_LARGE", "Payload excede o limite.", 413);
  }

  const rawBody = await request.text();
  if (rawBody.length > 256_000) {
    return apiFailure("PAYLOAD_TOO_LARGE", "Payload excede o limite.", 413);
  }

  const result = await processMercadoPagoWebhook({
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
    result.status
  );
}
