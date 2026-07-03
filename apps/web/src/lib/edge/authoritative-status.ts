/** Prefixos que exigem status autoritativo do banco no middleware (via /api/auth/session-check). */

export const AUTHORITATIVE_STATUS_PREFIXES = [
  "/dashboard",
  "/api/client",
  "/api/partner",
  "/api/admin",
  "/meu-pet",
  "/agenda",
  "/marketplace",
  "/pedidos",
  "/adocao",
  "/ong",
] as const;

export function requiresAuthoritativeStatus(pathname: string): boolean {
  return AUTHORITATIVE_STATUS_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );
}
