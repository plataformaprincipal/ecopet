import { Router } from "express";
import { z } from "zod";
import type { AuthRequest } from "../middleware/auth.js";
import { paramString } from "../lib/request-utils.js";
import { sendSuccess, sendFailure } from "../lib/express-api-response.js";
import { addToCart, clearCart, getOrCreateCart, serializeCart, updateCartItem } from "../services/cart-service.js";

const router = Router();

router.get("/", async (req: AuthRequest, res, next) => {
  try {
    return sendSuccess(res, { cart: serializeCart(await getOrCreateCart(req.userId!)) });
  } catch (e) {
    next(e);
  }
});

router.post("/items", async (req: AuthRequest, res, next) => {
  try {
    const { productId, quantity } = z.object({ productId: z.string(), quantity: z.number().int().positive().optional() }).parse(req.body);
    const cart = serializeCart(await addToCart(req.userId!, productId, quantity ?? 1));
    return sendSuccess(res, { cart }, 201);
  } catch (e) {
    const message = (e as Error).message;
    if (message === "PRODUCT_NOT_FOUND") return sendFailure(res, "NOT_FOUND", "Produto indisponível", 404);
    if (message === "MULTI_PARTNER_CART") return sendFailure(res, "CONFLICT", "Carrinho aceita um parceiro por vez", 409);
    if (message === "INSUFFICIENT_STOCK") return sendFailure(res, "VALIDATION", "Estoque insuficiente", 400);
    next(e);
  }
});

router.patch("/items/:id", async (req: AuthRequest, res, next) => {
  try {
    const { quantity } = z.object({ quantity: z.number().int() }).parse(req.body);
    const cart = serializeCart(await updateCartItem(req.userId!, paramString(req.params.id), quantity));
    return sendSuccess(res, { cart });
  } catch (e) {
    if ((e as Error).message === "ITEM_NOT_FOUND") return sendFailure(res, "NOT_FOUND", "Item não encontrado", 404);
    next(e);
  }
});

router.delete("/", async (req: AuthRequest, res, next) => {
  try {
    return sendSuccess(res, { cart: serializeCart(await clearCart(req.userId!)) });
  } catch (e) {
    next(e);
  }
});

export default router;
