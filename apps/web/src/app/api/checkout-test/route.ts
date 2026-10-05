import { apiSuccess, apiFailure } from "@/lib/api-response";
import { requireAuth } from "@/lib/auth/guards";
import { checkoutSchema } from "@/schemas/product";
import { checkoutTestFromCart } from "@/lib/mercado-pago/checkout-test-service";
import { checkCheckoutTestRateLimit } from "@/lib/mercado-pago/checkout-test-rate-limit";
import { CouponError } from "@/lib/commerce/apply-coupon";
import { PricingError } from "@/lib/pricing/service";
import { firstFieldError, zodIssuesToFieldMap } from "@/lib/validation/field-errors";
import {
  buildCheckoutTestNotes,
  isMercadoPagoTestCheckoutConfigured,
} from "@/lib/mercado-pago/test-credentials";

export const dynamic = "force-dynamic";

/** POST /api/checkout-test — cria Order válida via carrinho, marcada como TEST. */
export async function POST(request: Request) {
  const { user, error } = await requireAuth();
  if (error) return error;

  if (!isMercadoPagoTestCheckoutConfigured()) {
    return apiFailure(
      "MP_TEST_NOT_CONFIGURED",
      "Checkout de teste bloqueado: MERCADO_PAGO_TEST_ACCESS_TOKEN e NEXT_PUBLIC_MERCADO_PAGO_TEST_PUBLIC_KEY são obrigatórias.",
      503
    );
  }

  if (!(await checkCheckoutTestRateLimit(`checkout-test:create:${user!.id}`, 3, 60_000))) {
    return apiFailure("RATE_LIMIT", "Muitas tentativas de teste. Aguarde.", 429);
  }

  const parsed = checkoutSchema.safeParse(await request.json());
  if (!parsed.success) {
    const fields = zodIssuesToFieldMap(parsed.error);
    return apiFailure(
      "VALIDATION",
      firstFieldError(fields) ?? parsed.error.errors[0]?.message ?? "Inválido",
      400,
      { fields }
    );
  }

  try {
    const order = await checkoutTestFromCart({
      userId: user!.id,
      deliveryMethod: parsed.data.deliveryMethod,
      paymentMethod: parsed.data.paymentMethod,
      phone: parsed.data.phone,
      notes: buildCheckoutTestNotes(parsed.data.notes),
      address: parsed.data.address,


    });
    return apiSuccess({ order }, 201);
  } catch (e) {
    const message =
      e instanceof CouponError
        ? e.code
        : e instanceof PricingError
          ? e.code
          : e instanceof Error
            ? e.message
            : "Erro no checkout.";
    const map: Record<string, [string, string, number]> = {
      LEGACY_TEST_ORDER: ["CONFLICT", "Já existe um pedido TEST anterior. Não será criado outro pedido.", 409],
      CART_EMPTY: ["VALIDATION", "Carrinho sem produtos para teste.", 400],
      QUOTE_EXPIRED: ["VALIDATION", "Orçamento expirado.", 409],
      QUOTE_NOT_ACCEPTED: ["VALIDATION", "Orçamento não aceito.", 400],
      QUOTE_NOT_FOUND: ["VALIDATION", "Orçamento indisponível.", 400],
      QUOTE_FORBIDDEN: ["FORBIDDEN", "Orçamento não pertence a você.", 403],
      MULTI_PARTNER_CART: ["CONFLICT", "Carrinho com produtos de parceiros diferentes.", 409],
      INSUFFICIENT_STOCK: ["CONFLICT", "Estoque insuficiente para um ou mais itens.", 409],
      PRODUCT_NOT_FOUND: ["VALIDATION", "Produto indisponível.", 400],
      PRODUCT_INACTIVE: ["VALIDATION", "Produto inativo.", 400],
      PRODUCT_NOT_APPROVED: ["VALIDATION", "Produto não publicado.", 400],
      PARTNER_NOT_APPROVED: ["FORBIDDEN", "Parceiro não aprovado para venda.", 403],
      INVALID_TOTAL: ["VALIDATION", "Total do pedido inválido.", 400],
      INVALID_UNIT_PRICE: ["VALIDATION", "Preço inválido.", 400],
      INVALID_QUANTITY: ["VALIDATION", "Quantidade inválida.", 400],
      IDEMPOTENCY_CONFLICT: ["CONFLICT", "Chave de idempotência já utilizada.", 409],
      CHECKOUT_DISABLED: ["CHECKOUT_DISABLED", "Checkout temporariamente indisponível.", 503],
      COUPON_NOT_FOUND: ["VALIDATION", "Cupom inválido.", 400],
      COUPON_INACTIVE: ["VALIDATION", "Cupom inativo.", 400],
      COUPON_EXPIRED: ["VALIDATION", "Cupom expirado.", 400],
      COUPON_USED: ["VALIDATION", "Este cupom já foi utilizado.", 400],
      COUPON_EXHAUSTED: ["VALIDATION", "Cupom esgotado.", 400],
      MARGIN_FLOOR: ["VALIDATION", "Desconto recusado: margem abaixo do piso.", 400],
      NEGATIVE_PAYOUT: ["VALIDATION", "Cotação inválida: payout negativo.", 400],
      ZERO_PRICE_NOT_ALLOWED: ["VALIDATION", "Preço zero não permitido.", 400],
      VERSION_NOT_ACTIVE: ["CONFLICT", "Versão de pricing indisponível.", 409],
      PRICING_UNAVAILABLE: ["VALIDATION", "Não foi possível calcular o preço agora. Tente novamente.", 503],
      PRICING_SCHEMA_UNAVAILABLE: ["VALIDATION", "Tabela de preços indisponível no momento.", 503],
    };
    const hit = map[message];
    if (hit) return apiFailure(hit[0], hit[1], hit[2]);
    console.error("[checkout-test]", message);
    return apiFailure("INTERNAL", "Erro ao finalizar pedido de teste.", 500);
  }
}
