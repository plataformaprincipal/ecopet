/**
 * Fase 2 — desativa mutações comerciais no Express.
 * Fonte oficial: Route Handlers Next.js (cart/checkout/orders/partner/products).
 */
import type { Request, Response, NextFunction } from "express";

const SUCCESSOR: Record<string, string> = {
  "/api/orders": "/api/checkout e /api/client/orders",
  "/api/cart": "/api/cart",
  "/api/marketplace/partner": "/api/partner/*",
  "/api/products": "/api/partner/products e /api/marketplace/*",
  "/api/services": "/api/partner/services e /api/marketplace/*",
};

function successorFor(path: string): string {
  for (const [prefix, next] of Object.entries(SUCCESSOR)) {
    if (path.startsWith(prefix)) return next;
  }
  return "/api/* (Next.js)";
}

/**
 * Bloqueia POST/PUT/PATCH/DELETE em rotas comerciais Express.
 * GET permanece temporariamente (somente leitura) com header Deprecation.
 */
export function blockCommercialMutations(req: Request, res: Response, next: NextFunction) {
  const method = req.method.toUpperCase();
  const path = req.originalUrl.split("?")[0] ?? req.path;

  res.setHeader("Deprecation", "true");
  res.setHeader("Sunset", "2026-09-30");
  res.setHeader("X-EcoPet-Commercial-Source", "nextjs");
  res.setHeader("Link", `<${successorFor(path)}>; rel="successor-version"`);

  if (method === "GET" || method === "HEAD" || method === "OPTIONS") {
    return next();
  }

  return res.status(410).json({
    success: false,
    error: {
      code: "COMMERCIAL_API_MOVED",
      message:
        "Mutações comerciais via Express foram desativadas. Use as Route Handlers Next.js oficiais.",
      successor: successorFor(path),
    },
  });
}
