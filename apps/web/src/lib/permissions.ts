/** Matriz de rotas e permissões por role — fundação EcoPet */

export type AppRole = "CLIENT" | "PARTNER" | "ONG" | "ADMIN";

/** Rotas exclusivas de administrador */
export const ADMIN_ONLY_PREFIXES = ["/gestor", "/admin"] as const;

/** Prefixos permitidos por role (middleware + navegação) */
export const ROLE_ROUTE_PREFIXES: Record<AppRole, readonly string[]> = {
  CLIENT: [
    "/dashboard",
    "/perfil",
    "/meu-pet",
    "/pets",
    "/inicio",
    "/feed",
    "/explorar",
    "/explore",
    "/social",
    "/marketplace",
    "/notificacoes",
    "/ia",
    "/agenda",
    "/health",
    "/iot",
    "/chat",
    "/configuracoes",
    "/pedidos",
    "/onboarding",
    "/adocao",
    "/veterinarios",
    "/clinicas",
    "/insights",
    "/checkout",
  ],
  PARTNER: [
    "/dashboard",
    "/perfil",
    "/marketplace",
    "/notificacoes",
    "/social/mensagens",
    "/agenda",
    "/configuracoes",
    "/pedidos",
  ],
  ONG: [
    "/dashboard",
    "/perfil",
    "/dashboard/ong",
    "/ong",
    "/adocao",
    "/notificacoes",
    "/social/mensagens",
    "/configuracoes",
  ],
  ADMIN: ["/gestor", "/admin", "/dashboard", "/configuracoes"],
};

/** Prefixos bloqueados por role (além de admin-only) */
export const ROLE_DENIED_PREFIXES: Record<AppRole, readonly string[]> = {
  CLIENT: ["/agro", "/dashboard/clinica", "/dashboard/petshop", "/dashboard/prestador", "/dashboard/seller", "/dashboard/veterinario"],
  PARTNER: ["/agro", "/meu-pet", "/pets", "/health", "/iot", "/ia", "/inicio", "/feed", "/explorar", "/social/reels", "/social/stories", "/dashboard/ong", "/ong"],
  ONG: ["/agro", "/meu-pet", "/pets", "/marketplace", "/ia", "/health", "/iot", "/dashboard/prestador", "/dashboard/seller", "/parceiro"],
  ADMIN: ["/meu-pet", "/pets", "/marketplace", "/ia", "/inicio", "/feed", "/explorar", "/social", "/agro"],
};

export function isAdminOnlyPath(pathname: string): boolean {
  return ADMIN_ONLY_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export function pathMatchesPrefix(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

export function canAccessRoute(role: AppRole, pathname: string): boolean {
  if (isAdminOnlyPath(pathname)) {
    return role === "ADMIN";
  }

  const denied = ROLE_DENIED_PREFIXES[role] ?? [];
  if (denied.some((p) => pathMatchesPrefix(pathname, p))) {
    return false;
  }

  const allowed = ROLE_ROUTE_PREFIXES[role] ?? [];
  return allowed.some((p) => pathMatchesPrefix(pathname, p));
}

export function getDefaultDashboardPath(role: AppRole): string {
  switch (role) {
    case "ADMIN":
      return "/gestor";
    case "PARTNER":
    case "ONG":
    case "CLIENT":
    default:
      return "/dashboard";
  }
}

export function assertRole(userRole: AppRole, allowed: AppRole[]): boolean {
  return allowed.includes(userRole);
}

export function canManageResource(ownerId: string, userId: string): boolean {
  return ownerId === userId;
}
