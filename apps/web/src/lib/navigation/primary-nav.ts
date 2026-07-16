/**
 * Navegação principal EcoPet — única fonte de verdade (5 itens).
 * Funcionalidades secundárias permanecem em sidebars/submenus/páginas internas.
 */
import type { LucideIcon } from "lucide-react";
import { Users, Compass, ShoppingBag, Sparkles, User } from "lucide-react";
import type { TranslationKey } from "@/lib/i18n/types";

export type PrimaryNavId = "social" | "explore" | "marketplace" | "eccopet" | "profile";

export type PrimaryNavItem = {
  id: PrimaryNavId;
  /** Label completa (desktop / aria) */
  labelKey: TranslationKey;
  /** Label curta mobile */
  mobileLabelKey: TranslationKey;
  icon: LucideIcon;
  /** Href público / compartilhado */
  href: string;
  /** Prefixos que marcam o item como ativo */
  match: string[];
};

/** Cinco destinos principais — rotas públicas existentes reutilizadas. */
export const PRIMARY_NAVIGATION: PrimaryNavItem[] = [
  {
    id: "social",
    labelKey: "nav.socialNetwork",
    mobileLabelKey: "pub.nav.socialShort",
    icon: Users,
    href: "/social",
    match: ["/social", "/feed", "/client/social"],
  },
  {
    id: "explore",
    labelKey: "nav.explore",
    mobileLabelKey: "pub.nav.exploreShort",
    icon: Compass,
    href: "/explorar",
    match: ["/explorar", "/cliente/explorar", "/client/explore", "/adocao"],
  },
  {
    id: "marketplace",
    labelKey: "nav.marketplace",
    mobileLabelKey: "pub.nav.marketShort",
    icon: ShoppingBag,
    href: "/marketplace",
    match: ["/marketplace", "/cliente/marketplace", "/client/marketplace", "/produtos", "/carrinho", "/pedidos"],
  },
  {
    id: "eccopet",
    labelKey: "pub.nav.eccopet",
    mobileLabelKey: "pub.nav.eccopet",
    icon: Sparkles,
    href: "/eccopet",
    match: ["/eccopet", "/ia", "/cliente/ia", "/cliente/assistente", "/client/eccopet"],
  },
  {
    id: "profile",
    labelKey: "nav.profile",
    mobileLabelKey: "pub.nav.profileShort",
    icon: User,
    href: "/perfil",
    match: ["/perfil", "/profile", "/cliente/perfil", "/client/profile", "/configuracoes"],
  },
];

export type PrimaryNavContext = "public" | "clientPt" | "clientEn" | "partner" | "ong";

/**
 * Resolve hrefs contextuais sem duplicar páginas.
 * Mantém as 5 entradas; só troca o destino da persona quando a rota dedicada existe.
 */
export function getPrimaryNavigation(context: PrimaryNavContext = "public"): PrimaryNavItem[] {
  if (context === "clientPt") {
    return PRIMARY_NAVIGATION.map((item) => {
      switch (item.id) {
        case "explore":
          return { ...item, href: "/cliente/explorar" };
        case "marketplace":
          return { ...item, href: "/cliente/marketplace" };
        case "eccopet":
          return { ...item, href: "/eccopet" };
        case "profile":
          return { ...item, href: "/cliente/perfil" };
        case "social":
        default:
          return { ...item, href: "/social" };
      }
    });
  }

  if (context === "clientEn") {
    return PRIMARY_NAVIGATION.map((item) => {
      switch (item.id) {
        case "social":
          return { ...item, href: "/client/social" };
        case "explore":
          return { ...item, href: "/client/explore" };
        case "marketplace":
          return { ...item, href: "/client/marketplace" };
        case "eccopet":
          return { ...item, href: "/client/eccopet" };
        case "profile":
          return { ...item, href: "/client/profile" };
        default:
          return item;
      }
    });
  }

  // partner / ong / public: rotas públicas principais (áreas internas ficam na sidebar)
  return PRIMARY_NAVIGATION;
}

export function isPrimaryNavActive(pathname: string, item: PrimaryNavItem): boolean {
  const candidates = [item.href, ...item.match];
  return candidates.some((prefix) => {
    if (prefix === "/") return pathname === "/";
    return pathname === prefix || pathname.startsWith(`${prefix}/`);
  });
}

/** Altura da barra + safe area — usar no padding-bottom do conteúdo. */
export const PRIMARY_BOTTOM_NAV_CONTENT_PADDING =
  "pb-[calc(4.75rem+env(safe-area-inset-bottom))] lg:pb-8";
