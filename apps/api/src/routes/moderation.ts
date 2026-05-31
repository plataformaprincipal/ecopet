import { Router } from "express";
import type { AuthRequest } from "../middleware/auth.js";
import { createContentReport } from "../services/moderation-service.js";

const router = Router();

router.post("/reports", async (req: AuthRequest, res, next) => {
  try {
    const { targetType, targetId, reason, description } = req.body as {
      targetType: string;
      targetId: string;
      reason: string;
      description?: string;
    };
    if (!targetType || !targetId || !reason) {
      return res.status(400).json({ error: "targetType, targetId e reason são obrigatórios" });
    }
    const report = await createContentReport({
      reporterId: req.userId!,
      targetType,
      targetId,
      reason,
      description,
    });
    res.status(201).json(report);
  } catch (e) {
    next(e);
  }
});

export default router;
