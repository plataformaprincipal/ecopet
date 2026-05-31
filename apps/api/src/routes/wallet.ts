import { Router } from "express";
import { z } from "zod";
import type { AuthRequest } from "../middleware/auth.js";
import {
  getOrCreateWallet,
  getWalletStatement,
  generateWalletAiInsights,
  creditWallet,
  processRefund,
} from "../services/wallet-service.js";

const router = Router();

router.get("/balance", async (req: AuthRequest, res, next) => {
  try {
    const wallet = await getOrCreateWallet(req.userId!);
    res.json({ balance: wallet.balance, currency: wallet.currency });
  } catch (e) {
    next(e);
  }
});

router.get("/statement", async (req: AuthRequest, res, next) => {
  try {
    const data = await getWalletStatement(req.userId!);
    res.json(data);
  } catch (e) {
    next(e);
  }
});

router.get("/insights", async (req: AuthRequest, res, next) => {
  try {
    const insights = await generateWalletAiInsights(req.userId!);
    res.json(insights);
  } catch (e) {
    next(e);
  }
});

const creditSchema = z.object({
  amount: z.number().positive(),
  description: z.string().optional(),
});

router.post("/credit", async (req: AuthRequest, res, next) => {
  try {
    if (req.userRole !== "ADMIN" && req.userRole !== "GESTOR") {
      return res.status(403).json({ error: "Apenas gestores podem creditar saldo manualmente" });
    }
    const { amount, description } = creditSchema.parse(req.body);
    const targetUserId = (req.body as { userId?: string }).userId ?? req.userId!;
    const result = await creditWallet({
      userId: targetUserId,
      amount,
      type: "BONUS",
      description: description ?? "Crédito manual ECOPET",
    });
    res.json(result);
  } catch (e) {
    next(e);
  }
});

const refundSchema = z.object({
  orderId: z.string(),
  amount: z.number().positive(),
  originalMethod: z.enum(["CARD", "PIX", "CASH", "TRANSFER", "WALLET", "BOLETO"]),
  reason: z.string().optional(),
});

router.post("/refund", async (req: AuthRequest, res, next) => {
  try {
    const data = refundSchema.parse(req.body);
    const refund = await processRefund({ userId: req.userId!, ...data });
    res.json(refund);
  } catch (e) {
    next(e);
  }
});

export default router;
