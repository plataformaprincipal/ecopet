import { z } from "zod";
import { apiSuccess, apiFailure } from "@/lib/api-response";
import { requireClient } from "@/lib/auth/require-auth";
import {
  serializeCart,
  resolveCartForRequest,
  addToCart,
  applyCartSessionCookie,
} from "@/lib/cart/cart-service";

const addItemSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().positive().optional(),
});

export async function POST(request: Request) {
  const { error } = await requireClient();
  if (error) return error;

  const { cart, newSessionId } = await resolveCartForRequest();

  const parsed = addItemSchema.safeParse(await request.json());
  if (!parsed.success) {
    return apiFailure("VALIDATION", parsed.error.errors[0]?.message ?? "Inválido", 400);
  }

  try {
    const updated = await addToCart(cart, parsed.data.productId, parsed.data.quantity ?? 1);
    const response = apiSuccess({ cart: serializeCart(updated) }, 201);
    return applyCartSessionCookie(response, newSessionId);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Erro ao adicionar item.";
    if (message === "PRODUCT_NOT_FOUND") {
      return apiFailure("NOT_FOUND", "Produto indisponível.", 404);
    }
    if (message === "MULTI_PARTNER_CART") {
      return apiFailure("CONFLICT", "Carrinho aceita produtos de um parceiro por vez.", 409);
    }
    if (message === "INSUFFICIENT_STOCK") {
      return apiFailure("VALIDATION", "Estoque insuficiente.", 400);
    }
    return apiFailure("INTERNAL", "Erro ao adicionar item.", 500);
  }
}
