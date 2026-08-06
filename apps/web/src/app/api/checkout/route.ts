import { apiSuccess, apiFailure } from "@/lib/api-response";
import { requireClient } from "@/lib/auth/require-auth";
import { checkoutSchema } from "@/schemas/product";
import { checkoutFromCart } from "@/lib/orders/checkout-service";

export async function POST(request: Request) {
  const { user, error } = await requireClient();
  if (error) return error;

  const parsed = checkoutSchema.safeParse(await request.json());
  if (!parsed.success) {
    return apiFailure("VALIDATION", parsed.error.errors[0]?.message ?? "Inválido", 400);
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
    });
    return apiSuccess({ order }, 201);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Erro no checkout.";
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
    };
    const hit = map[message];
    if (hit) return apiFailure(hit[0], hit[1], hit[2]);
    console.error("[checkout]", message);
    return apiFailure("INTERNAL", "Erro ao finalizar pedido.", 500);
  }
}
