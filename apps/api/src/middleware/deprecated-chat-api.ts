/**
 * Middleware de depreciação para rotas legadas de chat (Express).
 * Sucessor: /api/messages/* (Next.js)
 */
import type { Request, Response, NextFunction } from "express";

export function deprecatedChatApi(req: Request, res: Response, next: NextFunction) {
  res.setHeader("Deprecation", "true");
  res.setHeader("Sunset", "2026-12-31");
  res.setHeader("Link", '</api/messages/conversations>; rel="successor-version"');
  res.setHeader("X-EcoPet-Deprecated", "Use /api/messages/* — ver docs/api/chat-deprecation.md");
  next();
}
