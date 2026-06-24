import type { LucideIcon } from "lucide-react";
import { Home, Compass, ShoppingBag, Scissors, Heart, Users } from "lucide-react";

export type PublicClientNavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

/** Navegação pública premium (reexport para compatibilidade) */
export const PUBLIC_CLIENT_NAV: PublicClientNavItem[] = [
  { href: "/", label: "Início", icon: Home },
  { href: "/explorar", label: "Explorar", icon: Compass },
  { href: "/marketplace", label: "Marketplace", icon: ShoppingBag },
  { href: "/servicos", label: "Serviços", icon: Scissors },
  { href: "/adocao", label: "Adoção", icon: Heart },
  { href: "/feed", label: "Comunidade", icon: Users },
];

export function isPublicClientNavActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  if (href === "/marketplace") {
    return (
      pathname === "/marketplace" ||
      pathname.startsWith("/marketplace/") ||
      pathname.startsWith("/produtos") ||
      pathname.startsWith("/carrinho")
    );
  }
  if (href === "/feed") {
    return pathname === "/feed" || pathname.startsWith("/feed/") || pathname.startsWith("/social/");
  }
  if (href === "/servicos") {
    return pathname === "/servicos" || pathname.startsWith("/servicos/");
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

/** Rotas que usam o shell público do cliente (visitantes) */
export function isPublicClientShellPath(pathname: string): boolean {
  if (pathname === "/") return true;
  if (pathname === "/explorar" || pathname === "/explore") return true;
  if (pathname === "/social" || pathname.startsWith("/social/")) return true;
  if (pathname === "/eccopet" || pathname === "/ia") return true;
  if (pathname === "/adocao" || pathname.startsWith("/adocao/")) return true;
  if (pathname === "/feed" || pathname.startsWith("/feed/")) return true;
  if (pathname === "/meu-pet") return true;
  if (pathname === "/perfil" || pathname === "/profile") return true;
  if (pathname === "/marketplace") return true;
  if (pathname.startsWith("/marketplace/produto/")) return true;
  if (pathname.startsWith("/marketplace/servico/")) return true;
  if (pathname === "/marketplace/produtos") return true;
  if (pathname === "/marketplace/servicos") return true;
  if (pathname === "/marketplace/busca") return true;
  if (pathname === "/produtos" || pathname.startsWith("/produtos/")) return true;
  if (pathname === "/servicos" || pathname.startsWith("/servicos/")) return true;
  if (pathname.startsWith("/parceiros/") || pathname.startsWith("/lojas/")) return true;
  if (pathname === "/carrinho") return true;
  return false;
}

export function loginUrl(callbackPath: string): string {
  return `/login?callbackUrl=${encodeURIComponent(callbackPath)}`;
}

export function signupUrl(callbackPath?: string): string {
  if (!callbackPath) return "/cadastro";
  return `/cadastro?callbackUrl=${encodeURIComponent(callbackPath)}`;
}
