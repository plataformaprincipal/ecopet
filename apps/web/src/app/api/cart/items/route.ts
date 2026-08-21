import { z } from "zod";
import { apiSuccess, apiFailure } from "@/lib/api-response";
import {
  serializeCart,
  resolveCartForRequest,
  addToCart,
  addAiToCart,
  applyCartSessionCookie,
} from "@/lib/cart/cart-service";
import { getCurrentUser } from "@/lib/auth";
import { assertPetOwned } from "@/lib/ai-commerce/entitlement-service";
import { handleAiCommerceError } from "@/lib/ai-commerce/http";

const addItemSchema = z.object({
  productId: z.string().min(1).optional(),
  sku: z.string().min(1).optional(),
  petId: z.string().min(1).optional(),
  quantity: z.number().int().positive().optional(),
});

/** Visitante pode montar carrinho; autenticação só no checkout. DIGITAL_AI exige pet vinculado. */
export async function POST(request: Request) {
  const { cart, newSessionId } = await resolveCartForRequest();
  const parsed = addItemSchema.safeParse(await request.json());
  if (!parsed.success) {
    return apiFailure("VALIDATION", parsed.error.errors[0]?.message ?? "Inválido", 400);
  }

  try {
    if (parsed.data.sku) {
      const user = await getCurrentUser();
      if (!user) return apiFailure("AUTH_REQUIRED", "Entre na sua conta para vincular o pet e adicionar ao carrinho.", 401);
      if (!parsed.data.petId) return apiFailure("PET_REQUIRED", "Cadastre seu pet antes de continuar.", 400);
      const pet = await assertPetOwned(user.id, parsed.data.petId);
      const updated = await addAiToCart({
        cart,
        sku: parsed.data.sku,
        petId: parsed.data.petId,
        petName: pet.name,
        quantity: parsed.data.quantity ?? 1,
      });
      const response = apiSuccess({ cart: serializeCart(updated) }, 201);
      return applyCartSessionCookie(response, newSessionId);
    }

    if (!parsed.data.productId) {
      return apiFailure("VALIDATION", "Informe o produto.", 400);
    }
    const updated = await addToCart(cart, parsed.data.productId, parsed.data.quantity ?? 1);
    const response = apiSuccess({ cart: serializeCart(updated) }, 201);
    return applyCartSessionCookie(response, newSessionId);
  } catch (e) {
    const handled = handleAiCommerceError(e);
    const message = e instanceof Error ? e.message : "";
    if (message === "PRODUCT_NOT_FOUND") {
      return apiFailure("NOT_FOUND", "Produto indisponível.", 404);
    }
    if (message === "MULTI_PARTNER_CART") {
      return apiFailure("CONFLICT", "Carrinho aceita produtos de um parceiro por vez.", 409);
    }
    if (message === "INSUFFICIENT_STOCK") {
      return apiFailure("VALIDATION", "Estoque insuficiente.", 400);
    }
    if (message === "AI_COMMERCE_DISABLED") {
      return apiFailure("AI_COMMERCE_DISABLED", "As ferramentas EccoPet AI ainda não estão à venda neste ambiente.", 403);
    }
    if (handled.status !== 500) return handled;
    return apiFailure("INTERNAL", "Erro ao adicionar item.", 500);
  }
}
