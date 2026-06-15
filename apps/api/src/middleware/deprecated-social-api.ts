/**
 * Middleware de depreciação para rotas legadas de feed social (Express).
 * Sucessor: /api/social/* (Next.js)
 */
import type { Request, Response, NextFunction } from "express";

export function deprecatedSocialApi(req: Request, res: Response, next: NextFunction) {
  res.setHeader("Deprecation", "true");
  res.setHeader("Sunset", "2026-12-31");
  res.setHeader("Link", '</api/social/feed>; rel="successor-version"');
  res.setHeader("X-EcoPet-Deprecated", "Use /api/social/* — ver docs/api/social-deprecation.md");
  next();
}
