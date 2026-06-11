import { Router } from "express";
import rateLimit from "express-rate-limit";
import type { AuthRequest } from "../middleware/auth.js";
import { authMiddleware } from "../middleware/auth.js";
import {
  getOrCreateGuestSession,
  sendGuestChatMessage,
  convertGuestSessionToUser,
} from "../services/guest-chat-service.js";

const router = Router();

const guestLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 40,
  message: { error: "Limite de mensagens atingido. Tente novamente mais tarde." },
});

router.post("/session", guestLimiter, async (req, res, next) => {
  try {
    const { guestId, sessionId, browserId } = req.body as {
      guestId: string;
      sessionId: string;
      browserId?: string;
    };
    if (!guestId || !sessionId) {
      return res.status(400).json({ error: "guestId e sessionId são obrigatórios" });
    }
    const session = await getOrCreateGuestSession({ guestId, sessionId, browserId });
    res.json(session);
  } catch (e) {
    next(e);
  }
});

router.post("/messages", guestLimiter, async (req, res, next) => {
  try {
    const { guestId, content } = req.body as { guestId: string; content: string };
    if (!guestId || !content?.trim()) {
      return res.status(400).json({ error: "Mensagem inválida" });
    }
    const result = await sendGuestChatMessage(guestId, content.trim());
    res.status(201).json(result);
  } catch (e) {
    const msg = (e as Error).message;
    if (msg === "SESSION_EXPIRED") return res.status(410).json({ error: "Sessão expirada" });
    if (msg === "RATE_LIMIT") return res.status(429).json({ error: "Limite de mensagens da sessão atingido" });
    next(e);
  }
});

router.post("/convert", authMiddleware, async (req: AuthRequest, res, next) => {
  try {
    const { guestId } = req.body as { guestId: string };
    if (!guestId) return res.status(400).json({ error: "guestId obrigatório" });
    const conversation = await convertGuestSessionToUser(guestId, req.userId!);
    res.json(conversation);
  } catch (e) {
    next(e);
  }
});

export default router;
