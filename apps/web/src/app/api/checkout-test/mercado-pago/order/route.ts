import { z } from "zod";
import { apiFailure, apiSuccess } from "@/lib/api-response";
import { requireAuth } from "@/lib/auth/require-auth";
import { checkRateLimit } from "@/lib/rate-limit";
import { createMercadoPagoCheckoutTestOrder } from "@/lib/mercado-pago/create-checkout-test-order";
import { getMercadoPagoTestCheckoutBlock } from "@/lib/mercado-pago/test-credentials";
import { assertCheckoutEnabled } from "@/lib/commerce/checkout-flags";

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

/** POST /api/checkout-test/mercado-pago/order — API Orders TEST only. */
export async function POST(request: Request) {
  const { user, error } = await requireAuth();
  if (error) return error;

  if (!checkRateLimit(`mp-checkout-test:${user!.id}`, 10, 60_000)) {
    return apiFailure("RATE_LIMIT", "Muitas tentativas. Aguarde um momento.", 429);
  }

  try {
    assertCheckoutEnabled();
  } catch {
    return apiFailure("CHECKOUT_DISABLED", "Checkout temporariamente indisponível.", 503);
  }

  const block = getMercadoPagoTestCheckoutBlock();
  if (block) return apiFailure(block.code, block.message, 503);

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
    const result = await createMercadoPagoCheckoutTestOrder({
      userId: user!.id,
      ...parsed.data,
    });
    return apiSuccess(result, 201);
  } catch (e) {
    const code = e instanceof Error ? e.message : "INTERNAL";
    const map: Record<string, { status: number; message: string }> = {
      ORDER_NOT_FOUND: { status: 404, message: "Pedido não encontrado." },
      ORDER_FORBIDDEN: { status: 403, message: "Pedido não pertence a este usuário." },
      ORDER_NOT_TEST: { status: 403, message: "Pedido não é de checkout de teste." },
      ORDER_NOT_PAYABLE: { status: 409, message: "Pedido não está disponível para pagamento." },
      ALREADY_PAID: { status: 409, message: "Pedido já pago." },
      INVALID_AMOUNT: { status: 400, message: "Valor do pedido inválido." },
      INVALID_CARD_TOKEN: { status: 400, message: "Token de cartão inválido." },
      PAYER_EMAIL_REQUIRED: { status: 400, message: "E-mail do pagador obrigatório." },
      MP_TEST_NOT_CONFIGURED: { status: 503, message: "Credenciais de teste Mercado Pago ausentes." },
      MP_TEST_MATCHES_LIVE: { status: 503, message: "Credenciais TEST coincidem com LIVE." },
      MP_UNAUTHORIZED: { status: 502, message: "Falha de autenticação com Mercado Pago TEST." },
      MP_VALIDATION: { status: 422, message: "Dados rejeitados pelo Mercado Pago TEST." },
      MP_RATE_LIMIT: { status: 429, message: "Limite do Mercado Pago. Tente novamente." },
      MP_TIMEOUT: { status: 504, message: "Timeout no Mercado Pago TEST." },
      MP_UNAVAILABLE: { status: 502, message: "Mercado Pago TEST indisponível." },
    };
    const mapped = map[code];
    if (mapped) return apiFailure(code, mapped.message, mapped.status);
    if (code.startsWith("MP_VALIDATION")) {
      return apiFailure(code, "Dados rejeitados pelo Mercado Pago TEST.", 422);
    }
    if (code === "MP_PAYMENT_REQUIRED") {
      return apiFailure(code, "Conta Mercado Pago TEST sem permissão de cobrança.", 402);
    }
    return apiFailure("INTERNAL", "Erro ao processar pagamento de teste.", 500);
  }
}
