/** Rotas e regras de acesso público/privado — ECOPET Web */

export const AUTH_ROUTES = [
  "/login",
  "/cadastro",
  "/recuperar-senha",
  "/redefinir-senha",
  "/forgot-password",
  "/reset-password",
] as const;

export const PUBLIC_EXACT = new Set([
  "/",
  "/login",
  "/cadastro",
  "/recuperar-senha",
  "/redefinir-senha",
  "/forgot-password",
  "/reset-password",
  "/termos",
  "/termos-de-uso",
  "/privacidade",
  "/politica-de-privacidade",
]);

export const PUBLIC_PREFIXES = ["/petshop-web", "/pet/"] as const;

/** Marketplace: visitante pode navegar (sem carrinho/favoritos/checkout). */
export function isPublicMarketplacePath(pathname: string): boolean {
  if (pathname === "/marketplace") return true;
  if (pathname.startsWith("/marketplace/produtos")) return true;
  if (pathname.startsWith("/marketplace/servicos")) return true;
  if (pathname.startsWith("/marketplace/busca")) return true;
  if (/^\/marketplace\/produto\/.+/.test(pathname)) return true;
  if (/^\/marketplace\/servico\/.+/.test(pathname)) return true;
  if (/^\/marketplace\/parceiro\/.+/.test(pathname)) return true;
  return false;
}

export const PRIVATE_MARKETPLACE_PREFIXES = [
  "/marketplace/carrinho",
  "/marketplace/checkout",
  "/marketplace/favoritos",
  "/marketplace/orcamentos",
  "/marketplace/chat",
] as const;

export function isPrivateMarketplacePath(pathname: string): boolean {
  return PRIVATE_MARKETPLACE_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export function isPublicPath(pathname: string): boolean {
  if (PUBLIC_EXACT.has(pathname)) return true;
  if (PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))) return true;
  if (isPublicMarketplacePath(pathname)) return true;
  return false;
}

export function requiresAuth(pathname: string): boolean {
  if (isPublicPath(pathname)) return false;
  if (pathname.startsWith("/api/")) return false;
  if (pathname.startsWith("/_next")) return false;
  if (pathname.includes(".")) return false; // static assets
  return true;
}

/** Após login, redirecionar conforme papel. */
export function dashboardPathForRole(role: string): string {
  switch (role) {
    case "GESTOR":
    case "ADMIN":
      return "/gestor";
    case "TUTOR":
      return "/dashboard";
    case "VETERINARIAN":
      return "/dashboard/veterinario";
    case "CLINIC":
      return "/dashboard/clinica";
    case "PETSHOP":
      return "/dashboard/petshop";
    case "SELLER":
      return "/dashboard/seller";
    case "SERVICE_PROVIDER":
      return "/dashboard/prestador";
    case "ONG":
    case "PROTECTOR":
      return "/dashboard/ong";
    case "AGROPET":
      return "/agro";
    case "PARTNER":
      return "/dashboard/prestador";
    default:
      return "/dashboard";
  }
}

export const EMPTY_MESSAGES = {
  posts: "Você ainda não possui publicações.",
  pets: "Você ainda não cadastrou pets.",
  messages: "Você ainda não possui conversas.",
  notifications: "Você ainda não possui notificações.",
  appointments: "Você ainda não realizou agendamentos.",
  orders: "Você ainda não possui pedidos.",
  favorites: "Você ainda não favoritou itens.",
} as const;
