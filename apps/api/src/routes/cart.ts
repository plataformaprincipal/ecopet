import { Router } from "express";
import { z } from "zod";
import type { AuthRequest } from "../middleware/auth.js";
import { paramString } from "../lib/request-utils.js";
import { addToCart, clearCart, getOrCreateCart, serializeCart, updateCartItem } from "../services/cart-service.js";

const router = Router();

router.get("/", async (req: AuthRequest, res, next) => {
  try {
    res.json(serializeCart(await getOrCreateCart(req.userId!)));
  } catch (e) {
    next(e);
  }
});

router.post("/items", async (req: AuthRequest, res, next) => {
  try {
    const { productId, quantity } = z.object({ productId: z.string(), quantity: z.number().int().positive().optional() }).parse(req.body);
    res.status(201).json(serializeCart(await addToCart(req.userId!, productId, quantity ?? 1)));
  } catch (e) {
    if ((e as Error).message === "PRODUCT_NOT_FOUND") return res.status(404).json({ error: "Produto indisponível" });
    next(e);
  }
});

router.patch("/items/:id", async (req: AuthRequest, res, next) => {
  try {
    const { quantity } = z.object({ quantity: z.number().int() }).parse(req.body);
    res.json(serializeCart(await updateCartItem(req.userId!, paramString(req.params.id), quantity)));
  } catch (e) {
    if ((e as Error).message === "ITEM_NOT_FOUND") return res.status(404).json({ error: "Item não encontrado" });
    next(e);
  }
});

router.delete("/", async (req: AuthRequest, res, next) => {
  try {
    res.json(serializeCart(await clearCart(req.userId!)));
  } catch (e) {
    next(e);
  }
});

export default router;
