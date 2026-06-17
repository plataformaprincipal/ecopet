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

  try {
    const order = await checkoutFromCart({
      userId: user!.id,
      deliveryMethod: parsed.data.deliveryMethod,
      paymentMethod: parsed.data.paymentMethod,
      phone: parsed.data.phone,
      notes: parsed.data.notes,
      address: parsed.data.address,
    });
    return apiSuccess({ order }, 201);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Erro no checkout.";
    if (message === "CART_EMPTY") {
      return apiFailure("VALIDATION", "Carrinho vazio.", 400);
    }
    if (message === "MULTI_PARTNER_CART") {
      return apiFailure("CONFLICT", "Carrinho com produtos de parceiros diferentes.", 409);
    }
    if (message === "INSUFFICIENT_STOCK") {
      return apiFailure("CONFLICT", "Estoque insuficiente para um ou mais itens.", 409);
    }
    return apiFailure("INTERNAL", "Erro ao finalizar pedido.", 500);
  }
}
