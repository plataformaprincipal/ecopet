import { Router } from "express";
import type { AuthRequest } from "../middleware/auth.js";
import { paramString } from "../lib/request-utils.js";
import {
  getUserConversations,
  getConversationMessages,
  createConversation,
  sendMessage,
  findOrCreateEcopetSupport,
  markConversationRead,
} from "../services/chat-service.js";
import { generateChatAiReply } from "../services/ai-chat-service.js";
import { createAuditLog } from "../services/audit-service.js";
import type { ConversationType } from "@prisma/client";

const router = Router();

router.get("/", async (req: AuthRequest, res, next) => {
  try {
    res.json(await getUserConversations(req.userId!));
  } catch (e) {
    next(e);
  }
});

router.post("/", async (req: AuthRequest, res, next) => {
  try {
    const { type, title, participantIds } = req.body as {
      type: ConversationType;
      title?: string;
      participantIds: string[];
    };
    const conversation = await createConversation({
      type,
      title,
      participantIds,
      creatorId: req.userId!,
    });
    res.status(201).json(conversation);
  } catch (e) {
    next(e);
  }
});

router.post("/support", async (req: AuthRequest, res, next) => {
  try {
    res.json(await findOrCreateEcopetSupport(req.userId!));
  } catch (e) {
    next(e);
  }
});

router.post("/support/ecopet", async (req: AuthRequest, res, next) => {
  try {
    res.json(await findOrCreateEcopetSupport(req.userId!));
  } catch (e) {
    next(e);
  }
});

router.post("/ai", async (req: AuthRequest, res, next) => {
  try {
    const { message, conversationId } = req.body as { message: string; conversationId?: string };
    const result = await generateChatAiReply({
      message,
      userId: req.userId!,
      conversationId,
    });
    res.json(result);
  } catch (e) {
    next(e);
  }
});

router.get("/:id/messages", async (req: AuthRequest, res, next) => {
  try {
    const conversationId = paramString(req.params.id);
    res.json(await getConversationMessages(conversationId, req.userId!));
  } catch (e) {
    if ((e as Error).message === "FORBIDDEN") {
      return res.status(403).json({ error: "Acesso negado à conversa" });
    }
    next(e);
  }
});

router.post("/:id/messages", async (req: AuthRequest, res, next) => {
  try {
    const { content, type, metadata, triggerAi } = req.body as {
      content: string;
      type?: "TEXT" | "IMAGE" | "FILE" | "QUOTE" | "SYSTEM" | "AI";
      metadata?: Record<string, unknown>;
      triggerAi?: boolean;
    };
    const conversationId = paramString(req.params.id);
    const message = await sendMessage({
      conversationId,
      senderId: req.userId!,
      content,
      type,
      metadata,
      triggerAi,
    });
    await createAuditLog({
      userId: req.userId,
      action: "CREATE",
      module: "chat",
      resource: "message",
      resourceId: message.id,
      metadata: { conversationId },
    });
    res.status(201).json(message);
  } catch (e) {
    if ((e as Error).message === "FORBIDDEN") {
      return res.status(403).json({ error: "Acesso negado à conversa" });
    }
    next(e);
  }
});

router.patch("/:id/read", async (req: AuthRequest, res, next) => {
  try {
    const conversationId = paramString(req.params.id);
    res.json(await markConversationRead(conversationId, req.userId!));
  } catch (e) {
    if ((e as Error).message === "FORBIDDEN") {
      return res.status(403).json({ error: "Acesso negado à conversa" });
    }
    next(e);
  }
});

export default router;
