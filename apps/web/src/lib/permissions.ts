/** Matriz de rotas e permissões por role — fundação EcoPet */

export type AppRole = "CLIENT" | "PARTNER" | "ONG" | "ADMIN";

/** Rotas exclusivas de administrador */
export const ADMIN_ONLY_PREFIXES = ["/gestor", "/admin"] as const;

/** Prefixos permitidos por role (middleware + navegação) */
export const ROLE_ROUTE_PREFIXES: Record<AppRole, readonly string[]> = {
  CLIENT: [
    "/dashboard",
    "/dashboard/client",
    "/dashboard/client/profile",
    "/dashboard/client/pets",
    "/dashboard/client/services",
    "/dashboard/client/appointments",
    "/dashboard/client/orders",
    "/dashboard/messages",
    "/dashboard/support",
    "/servicos",
    "/produtos",
    "/parceiros",
    "/lojas",
    "/carrinho",
    "/checkout",
    "/perfil",
    "/meu-pet",
    "/pets",
    "/inicio",
    "/feed",
    "/feed",
    "/feed/saved",
    "/feed/profile",
    "/dashboard/social",
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
    "/conta",
  ],
  PARTNER: [
    "/dashboard",
    "/dashboard/partner",
    "/dashboard/partner/profile",
    "/dashboard/partner/services",
    "/dashboard/partner/availability",
    "/dashboard/partner/appointments",
    "/dashboard/partner/products",
    "/dashboard/partner/inventory",
    "/dashboard/partner/orders",
    "/dashboard/messages",
    "/dashboard/support",
    "/dashboard/social",
    "/perfil",
    "/marketplace",
    "/notificacoes",
    "/feed",
    "/feed/profile",
    "/social/mensagens",
    "/agenda",
    "/configuracoes",
    "/pedidos",
    "/conta",
  ],
  ONG: [
    "/dashboard",
    "/perfil",
    "/dashboard/ong",
    "/dashboard/ong/profile",
    "/dashboard/messages",
    "/dashboard/support",
    "/dashboard/social",
    "/feed",
    "/feed/profile",
    "/ong",
    "/adocao",
    "/notificacoes",
    "/social/mensagens",
    "/configuracoes",
    "/conta",
  ],
  ADMIN: [
    "/gestor",
    "/admin",
    "/dashboard",
    "/dashboard/admin",
    "/dashboard/admin/gestor",
    "/dashboard/admin/privacy-requests",
    "/dashboard/admin/accounts",
    "/dashboard/admin/audit-logs",
    "/dashboard/admin/products",
    "/dashboard/admin/orders",
    "/dashboard/admin/reviews",
    "/dashboard/admin/integrations",
    "/dashboard/admin/support",
    "/dashboard/admin/messages",
    "/dashboard/admin/social",
    "/feed",
    "/configuracoes",
    "/conta",
  ],
};

/** Prefixos bloqueados por role (além de admin-only) */
export const ROLE_DENIED_PREFIXES: Record<AppRole, readonly string[]> = {
  CLIENT: ["/agro", "/dashboard/clinica", "/dashboard/petshop", "/dashboard/prestador", "/dashboard/seller", "/dashboard/veterinario", "/dashboard/partner", "/dashboard/ong", "/dashboard/admin"],
  PARTNER: ["/agro", "/meu-pet", "/pets", "/health", "/iot", "/ia", "/inicio", "/explorar", "/social/reels", "/social/stories", "/dashboard/ong", "/dashboard/client", "/dashboard/admin", "/ong"],
  ONG: ["/agro", "/meu-pet", "/pets", "/marketplace", "/ia", "/health", "/iot", "/dashboard/prestador", "/dashboard/seller", "/dashboard/client", "/dashboard/partner", "/dashboard/admin", "/parceiro"],
  ADMIN: ["/meu-pet", "/pets", "/marketplace", "/ia", "/inicio", "/feed", "/explorar", "/social", "/agro", "/dashboard/client", "/dashboard/partner"],
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
      return "/dashboard/admin";
    case "PARTNER":
      return "/dashboard/partner";
    case "ONG":
      return "/dashboard/ong";
    case "CLIENT":
      return "/dashboard/client";
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
