import { apiSuccess, apiFailure } from "@/lib/api-response";
import { requireAuth } from "@/lib/auth/require-auth";
import { checkRateLimit } from "@/lib/rate-limit";
import { PricingError } from "@/lib/pricing/service";
import { checkoutTestFromCart } from "@/lib/mercado-pago/checkout-test-from-cart";
import { isMercadoPagoTestCheckoutConfigured } from "@/lib/mercado-pago/test-credentials";

export const dynamic = "force-dynamic";

/** POST /api/checkout-test — Order TEST a partir do carrinho, sem estoque/ledger LIVE. */
export async function POST(request: Request) {
  const { user, error } = await requireAuth();
  if (error) return error;

  if (!checkRateLimit(`checkout-test:${user!.id}`, 5, 60_000)) {
    return apiFailure("RATE_LIMIT", "Muitas tentativas. Aguarde um momento.", 429);
  }

  if (!isMercadoPagoTestCheckoutConfigured()) {
    return apiFailure(
      "MP_TEST_NOT_CONFIGURED",
      "Checkout de teste bloqueado: MERCADO_PAGO_TEST_ACCESS_TOKEN e NEXT_PUBLIC_MERCADO_PAGO_TEST_PUBLIC_KEY são obrigatórias.",
      503
    );
  }

  const idempotencyKey =
    request.headers.get("idempotency-key")?.trim() ||
    request.headers.get("x-idempotency-key")?.trim() ||
    null;

  try {
    const order = await checkoutTestFromCart({
      userId: user!.id,
      idempotencyKey,
    });
    return apiSuccess({ order }, 201);
  } catch (e) {
    const message = e instanceof PricingError ? e.code : e instanceof Error ? e.message : "Erro no checkout.";
    const map: Record<string, [string, string, number]> = {
      CART_EMPTY: ["VALIDATION", "Carrinho vazio.", 400],
      MULTI_PARTNER_CART: ["CONFLICT", "Carrinho com produtos de parceiros diferentes.", 409],
      PRODUCT_NOT_FOUND: ["VALIDATION", "Produto indisponível.", 400],
      INVALID_TOTAL: ["VALIDATION", "Total do pedido inválido.", 400],
      INVALID_UNIT_PRICE: ["VALIDATION", "Preço inválido.", 400],
      INVALID_QUANTITY: ["VALIDATION", "Quantidade inválida.", 400],
      IDEMPOTENCY_CONFLICT: ["CONFLICT", "Chave de idempotência já utilizada.", 409],
      PRICING_UNAVAILABLE: ["VALIDATION", "Não foi possível calcular o preço agora. Tente novamente.", 503],
      PRICING_SCHEMA_UNAVAILABLE: ["VALIDATION", "Tabela de preços indisponível no momento.", 503],
    };
    const hit = map[message];
    if (hit) return apiFailure(hit[0], hit[1], hit[2]);
    console.error("[checkout-test]", message);
    return apiFailure("INTERNAL", "Erro ao finalizar pedido de teste.", 500);
  }
}
