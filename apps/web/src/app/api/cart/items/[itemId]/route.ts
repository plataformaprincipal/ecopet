import { z } from "zod";
import { apiSuccess, apiFailure } from "@/lib/api-response";
import {
  serializeCart,
  resolveCartForRequest,
  updateCartItem,
  applyCartSessionCookie,
} from "@/lib/cart/cart-service";

const patchSchema = z.object({
  quantity: z.number().int(),
});

type RouteContext = { params: Promise<{ itemId: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const { cart, newSessionId } = await resolveCartForRequest();
  const { itemId } = await context.params;

  const parsed = patchSchema.safeParse(await request.json());
  if (!parsed.success) {
    return apiFailure("VALIDATION", parsed.error.errors[0]?.message ?? "Inválido", 400);
  }

  try {
    const updated = await updateCartItem(cart, itemId, parsed.data.quantity);
    const response = apiSuccess({ cart: serializeCart(updated) });
    return applyCartSessionCookie(response, newSessionId);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Erro ao atualizar item.";
    if (message === "ITEM_NOT_FOUND") {
      return apiFailure("NOT_FOUND", "Item não encontrado.", 404);
    }
    if (message === "INSUFFICIENT_STOCK") {
      return apiFailure("VALIDATION", "Estoque insuficiente.", 400);
    }
    return apiFailure("INTERNAL", "Erro ao atualizar item.", 500);
  }
}

export async function DELETE(_req: Request, context: RouteContext) {
  const { cart, newSessionId } = await resolveCartForRequest();
  const { itemId } = await context.params;

  try {
    const updated = await updateCartItem(cart, itemId, 0);
    const response = apiSuccess({ cart: serializeCart(updated) });
    return applyCartSessionCookie(response, newSessionId);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Erro ao remover item.";
    if (message === "ITEM_NOT_FOUND") {
      return apiFailure("NOT_FOUND", "Item não encontrado.", 404);
    }
    return apiFailure("INTERNAL", "Erro ao remover item.", 500);
  }
}
