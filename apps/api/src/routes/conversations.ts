import { Router } from "express";
import type { AuthRequest } from "../middleware/auth.js";
import { paramString } from "../lib/request-utils.js";
import {
  getUserConversations,
  getConversationMessages,
  createConversation,
  sendMessage,
  findOrCreateEcopetSupport,
} from "../services/chat-service.js";
import { createAuditLog } from "../services/audit-service.js";
import type { ConversationType } from "@prisma/client";
import { deprecatedChatApi } from "../middleware/deprecated-chat-api.js";

const router = Router();

router.use(deprecatedChatApi);

router.get("/", async (req: AuthRequest, res, next) => {
  try {
    const conversations = await getUserConversations(req.userId!);
    res.json(conversations);
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

router.post("/support/ecopet", async (req: AuthRequest, res, next) => {
  try {
    const conversation = await findOrCreateEcopetSupport(req.userId!);
    res.json(conversation);
  } catch (e) {
    next(e);
  }
});

router.get("/:id/messages", async (req: AuthRequest, res, next) => {
  try {
    const conversationId = paramString(req.params.id);
    const messages = await getConversationMessages(conversationId, req.userId!);
    res.json(messages);
  } catch (e) {
    if ((e as Error).message === "FORBIDDEN") {
      return res.status(403).json({ error: "Acesso negado à conversa" });
    }
    next(e);
  }
});

router.post("/:id/messages", async (req: AuthRequest, res, next) => {
  try {
    const { content, type, metadata } = req.body as {
      content: string;
      type?: "TEXT" | "IMAGE" | "FILE" | "QUOTE" | "SYSTEM" | "AI";
      metadata?: Record<string, unknown>;
    };
    const conversationId = paramString(req.params.id);
    const message = await sendMessage({
      conversationId,
      senderId: req.userId!,
      content,
      type,
      metadata,
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

export default router;
