import { z } from "zod";
import { apiFailure, apiSuccess } from "@/lib/api-response";
import { requireClient } from "@/lib/auth/require-auth";
import { checkRateLimit } from "@/lib/rate-limit";
import { createMercadoPagoCheckoutOrder } from "@/lib/mercado-pago/create-checkout-order";
import { isMercadoPagoConfigured } from "@/lib/mercado-pago/config";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  orderId: z.string().min(1).max(64),
  paymentMethodId: z.string().min(1).max(64),
  paymentMethodType: z.string().max(32).optional(),
  cardToken: z.string().min(32).max(64).optional(),
  installments: z.number().int().min(1).max(24).optional(),
  payerEmail: z.string().email().max(120),
  payerFirstName: z.string().max(80).optional(),
  payerLastName: z.string().max(80).optional(),
  identificationType: z.string().max(10).optional(),
  identificationNumber: z.string().max(20).optional(),
});

/** POST /api/checkout/mercado-pago/order — cria order na API Orders. */
export async function POST(request: Request) {
  const { user, error } = await requireClient();
  if (error) return error;

  if (!checkRateLimit(`mp-checkout:${user!.id}`, 10, 60_000)) {
    return apiFailure("RATE_LIMIT", "Muitas tentativas. Aguarde um momento.", 429);
  }

  if (!isMercadoPagoConfigured()) {
    return apiFailure("NOT_CONFIGURED", "Mercado Pago não configurado.", 503);
  }

  const contentLength = Number(request.headers.get("content-length") || "0");
  if (contentLength > 32_000) {
    return apiFailure("PAYLOAD_TOO_LARGE", "Body excede o limite.", 413);
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return apiFailure("VALIDATION", "JSON inválido.", 400);
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return apiFailure("VALIDATION", parsed.error.errors[0]?.message ?? "Dados inválidos.", 400);
  }

  try {
    const result = await createMercadoPagoCheckoutOrder({
      userId: user!.id,
      ...parsed.data,
    });
    return apiSuccess(result, 201);
  } catch (e) {
    const code = e instanceof Error ? e.message : "INTERNAL";
    const map: Record<string, { status: number; message: string }> = {
      ORDER_NOT_FOUND: { status: 404, message: "Pedido não encontrado." },
      ORDER_FORBIDDEN: { status: 403, message: "Pedido não pertence a este usuário." },
      ORDER_NOT_PAYABLE: { status: 409, message: "Pedido não está disponível para pagamento." },
      ALREADY_PAID: { status: 409, message: "Pedido já pago." },
      INVALID_AMOUNT: { status: 400, message: "Valor do pedido inválido." },
      INVALID_CARD_TOKEN: { status: 400, message: "Token de cartão inválido." },
      PAYER_EMAIL_REQUIRED: { status: 400, message: "E-mail do pagador obrigatório." },
      MP_NOT_CONFIGURED: { status: 503, message: "Mercado Pago não configurado." },
      MP_UNAUTHORIZED: { status: 502, message: "Falha de autenticação com Mercado Pago." },
      MP_VALIDATION: { status: 422, message: "Dados rejeitados pelo Mercado Pago." },
      MP_RATE_LIMIT: { status: 429, message: "Limite do Mercado Pago. Tente novamente." },
      MP_TIMEOUT: { status: 504, message: "Timeout no Mercado Pago." },
      MP_UNAVAILABLE: { status: 502, message: "Mercado Pago indisponível." },
    };
    const mapped = map[code];
    if (mapped) return apiFailure(code, mapped.message, mapped.status);
    return apiFailure("INTERNAL", "Erro ao processar pagamento.", 500);
  }
}
