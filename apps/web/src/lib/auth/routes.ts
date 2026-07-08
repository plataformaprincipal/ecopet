/** Rotas e regras de acesso público/privado — ECOPET Web */

export const AUTH_ROUTES = [
  "/login",
  "/cadastro",
  "/recuperar-senha",
  "/redefinir-senha",
  "/esqueci-senha",
  "/forgot-password",
  "/reset-password",
] as const;

export const PUBLIC_EXACT = new Set([
  "/",
  "/login",
  "/cadastro",
  "/register",
  "/recuperar-senha",
  "/redefinir-senha",
  "/esqueci-senha",
  "/forgot-password",
  "/reset-password",
  "/termos",
  "/termos-de-uso",
  "/privacidade",
  "/privacy",
  "/politica-de-privacidade",
  "/unauthorized",
  "/legal/privacidade",
  "/legal/termos",
  "/legal/cliente/termos",
  "/legal/cliente/privacidade",
  "/legal/parceiro/termos",
  "/legal/parceiro/privacidade",
  "/legal/ong/termos",
  "/legal/ong/privacidade",
  "/legal/cookies",
  "/legal/lgpd",
  "/legal/exclusao-de-conta",
]);

export const PUBLIC_PREFIXES = ["/petshop-web", "/pet/", "/conta/"] as const;

/** Marketplace público Etapa 7/8 */
export function isPublicMarketplacePath(pathname: string): boolean {
  if (pathname === "/marketplace") return true;
  if (pathname.startsWith("/marketplace/produtos")) return true;
  if (pathname.startsWith("/marketplace/servicos")) return true;
  if (pathname.startsWith("/marketplace/busca")) return true;
  if (/^\/marketplace\/produto\/.+/.test(pathname)) return true;
  if (/^\/marketplace\/servico\/.+/.test(pathname)) return true;
  if (/^\/marketplace\/parceiro\/.+/.test(pathname)) return true;
  if (pathname === "/servicos" || pathname.startsWith("/servicos/")) return true;
  if (pathname === "/produtos" || pathname.startsWith("/produtos/")) return true;
  if (pathname.startsWith("/parceiros/")) return true;
  if (pathname.startsWith("/lojas/")) return true;
  if (pathname === "/carrinho") return true;
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

/** Rotas públicas do fluxo pré-cadastro cliente */
export function isPublicClientPath(pathname: string): boolean {
  if (pathname === "/explorar" || pathname === "/explore") return true;
  if (pathname === "/eccopet") return true;
  if (pathname === "/ia") return true;
  if (pathname === "/adocao" || pathname.startsWith("/adocao/")) return true;
  if (pathname === "/adoption" || pathname.startsWith("/adoption/")) return true;
  if (pathname === "/campaigns" || pathname.startsWith("/campaigns/")) return true;
  if (pathname.startsWith("/ngos/")) return true;
  return false;
}

/** Rotas públicas da rede social (visitante / pré-cadastro) */
export function isPublicSocialPath(pathname: string): boolean {
  if (pathname === "/feed") return true;
  if (pathname.startsWith("/feed/post/")) return true;
  if (/^\/feed\/profile\/[^/]+$/.test(pathname)) return true;
  if (pathname.startsWith("/feed/hashtag/")) return true;
  if (pathname === "/feed/search") return true;
  return false;
}

/** Rotas que exigem autenticação mesmo fora da matriz de roles */
export const AUTH_REQUIRED_EXACT = new Set([
  "/perfil",
  "/profile",
  "/social",
  "/pedidos",
  "/meu-pet",
  "/meupet",
]);

export function isAuthRequiredPath(pathname: string): boolean {
  if (AUTH_REQUIRED_EXACT.has(pathname)) return true;
  return false;
}

export function isPublicPath(pathname: string): boolean {
  if (PUBLIC_EXACT.has(pathname)) return true;
  if (PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))) return true;
  if (isPublicMarketplacePath(pathname)) return true;
  if (isPublicClientPath(pathname)) return true;
  if (isPublicSocialPath(pathname)) return true;
  return false;
}

export function requiresAuth(pathname: string): boolean {
  if (isAuthRequiredPath(pathname)) return true;
  if (isPublicPath(pathname)) return false;
  if (pathname.startsWith("/api/")) return false;
  if (pathname.startsWith("/_next")) return false;
  if (pathname.includes(".")) return false; // static assets
  return true;
}

/** Após login, redirecionar conforme papel — re-export centralizado */
export { dashboardPathForRole } from "@/lib/auth/dashboard";

export const EMPTY_MESSAGES = {
  posts: "Você ainda não possui publicações.",
  pets: "Você ainda não cadastrou pets.",
  messages: "Você ainda não possui conversas.",
  notifications: "Você ainda não possui notificações.",
  appointments: "Você ainda não realizou agendamentos.",
  orders: "Você ainda não possui pedidos.",
  favorites: "Você ainda não favoritou itens.",
  activities: "Você ainda não possui atividades.",
} as const;
