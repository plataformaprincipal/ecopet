import { apiSuccess, apiFailure } from "@/lib/api-response";
import { requireClient } from "@/lib/auth/require-auth";
import { checkoutSchema } from "@/schemas/product";
import { checkoutFromCart } from "@/lib/orders/checkout-service";
import { CouponError } from "@/lib/commerce/apply-coupon";
import { PricingError } from "@/lib/pricing/service";
import { firstFieldError, zodIssuesToFieldMap } from "@/lib/validation/field-errors";

export async function POST(request: Request) {
  const { user, error } = await requireClient();
  if (error) return error;

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

  const idempotencyKey =
    request.headers.get("idempotency-key")?.trim() ||
    request.headers.get("x-idempotency-key")?.trim() ||
    null;

  try {
    const order = await checkoutFromCart({
      userId: user!.id,
      deliveryMethod: parsed.data.deliveryMethod,
      paymentMethod: parsed.data.paymentMethod,
      phone: parsed.data.phone,
      notes: parsed.data.notes,
      address: parsed.data.address,
      idempotencyKey,
      couponCode: parsed.data.couponCode,
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
      CART_EMPTY: ["VALIDATION", "Carrinho vazio.", 400],
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
      CHECKOUT_DISABLED: [
        "CHECKOUT_DISABLED",
        "Checkout temporariamente indisponível.",
        503,
      ],
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
    console.error("[checkout]", message);
    return apiFailure("INTERNAL", "Erro ao finalizar pedido.", 500);
  }
}
