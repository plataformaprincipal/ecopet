/**
 * Rotas públicas/privadas para Edge Runtime (middleware).
 * Espelha lib/auth/routes.ts — manter sincronizado ao alterar regras públicas.
 */

export const PUBLIC_EXACT = new Set([
  "/",
  "/login",
  "/cadastro",
  "/recuperar-senha",
  "/redefinir-senha",
  "/esqueci-senha",
  "/forgot-password",
  "/reset-password",
  "/termos",
  "/termos-de-uso",
  "/privacidade",
  "/politica-de-privacidade",
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

export function isPublicClientPath(pathname: string): boolean {
  if (pathname === "/explorar" || pathname === "/explore") return true;
  if (pathname === "/social") return true;
  if (pathname === "/eccopet") return true;
  if (pathname === "/ia") return true;
  if (pathname === "/meu-pet") return true;
  if (pathname === "/perfil" || pathname === "/profile") return true;
  if (pathname === "/adocao" || pathname.startsWith("/adocao/")) return true;
  if (pathname === "/adoption" || pathname.startsWith("/adoption/")) return true;
  if (pathname === "/campaigns" || pathname.startsWith("/campaigns/")) return true;
  if (pathname.startsWith("/ngos/")) return true;
  return false;
}

export function isPublicSocialPath(pathname: string): boolean {
  if (pathname === "/social") return true;
  if (pathname === "/feed") return true;
  if (pathname.startsWith("/feed/post/")) return true;
  if (/^\/feed\/profile\/[^/]+$/.test(pathname)) return true;
  if (pathname.startsWith("/feed/hashtag/")) return true;
  if (pathname === "/feed/search") return true;
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
  if (isPublicPath(pathname)) return false;
  if (pathname.startsWith("/api/")) return false;
  if (pathname.startsWith("/_next")) return false;
  if (pathname.includes(".")) return false;
  return true;
}
