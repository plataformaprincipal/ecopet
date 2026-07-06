/** Prefixos que exigem status autoritativo do banco no middleware (via /api/auth/session-check). */

const ADMIN_ONLY_PREFIXES = ["/gestor", "/admin"] as const;

function isAdminOnlyPath(pathname: string): boolean {
  return ADMIN_ONLY_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export const AUTHORITATIVE_STATUS_PREFIXES = [
  "/admin",
  "/gestor",
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
  if (isAdminOnlyPath(pathname)) return true;
  return AUTHORITATIVE_STATUS_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );
}
