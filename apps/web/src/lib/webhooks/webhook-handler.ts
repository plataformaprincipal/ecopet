import { apiFailure, apiSuccess } from "@/lib/api-response";
import { receiveWebhook } from "@/lib/webhooks/webhook-service";

function idempotencyKey(request: Request, provider: string, externalId?: string) {
  const header = request.headers.get("x-idempotency-key") ?? request.headers.get("x-request-id");
  if (header) return `${provider}:${header}`;
  if (externalId) return `${provider}:${externalId}`;
  return undefined;
}

export async function POST(request: Request, provider: string) {
  const secretEnv = `${provider.toUpperCase().replace(/-/g, "_")}_WEBHOOK_SECRET`;
  const secret = process.env[secretEnv]?.trim();
  if (!secret && process.env.NODE_ENV === "production") {
    return apiFailure("NOT_CONFIGURED", `Webhook ${provider} não configurado.`, 503);
  }

  const raw = await request.text();
  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return apiFailure("VALIDATION", "Payload inválido.", 400);
  }

  const sig = request.headers.get("x-signature") ?? request.headers.get("stripe-signature");
  if (secret && process.env.WEBHOOK_VERIFY === "1" && !sig) {
    return apiFailure("INVALID_SIGNATURE", "Assinatura ausente.", 401);
  }

  const eventType = String(payload.type ?? payload.event ?? payload.action ?? "unknown");
  const externalId = String((payload as { id?: string }).id ?? (payload as { data?: { id?: string } }).data?.id ?? "");

  try {
    const result = await receiveWebhook({
      provider,
      eventType,
      payload,
      externalId: externalId || undefined,
      idempotencyKey: idempotencyKey(request, provider, externalId || undefined),
    });
    return apiSuccess({ received: true, duplicate: result.duplicate, id: result.event.id });
  } catch (e) {
    console.error(`[webhook:${provider}]`, e);
    return apiFailure("PROCESSING_ERROR", "Falha ao processar webhook.", 500);
  }
}

export async function GET() {
  return apiSuccess({ status: "ok", service: "ecopet-webhooks" });
}
