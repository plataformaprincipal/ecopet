/**
 * Navegação principal EcoPet — única fonte de verdade.
 * Desktop público e mobile público usam recortes diferentes da mesma tabela.
 * CLIENT / PARTNER / ONG mantêm o atalho operacional de 5 itens.
 */
import type { LucideIcon } from "lucide-react";
import { Users, Compass, ShoppingBag, Sparkles, User, Home, Scissors, Heart } from "lucide-react";
import type { TranslationKey } from "@/lib/i18n/types";

export type PrimaryNavId =
  | "home"
  | "social"
  | "explore"
  | "marketplace"
  | "services"
  | "eccopet"
  | "adoption"
  | "profile";

export type PrimaryNavItem = {
  id: PrimaryNavId;
  labelKey: TranslationKey;
  mobileLabelKey: TranslationKey;
  icon: LucideIcon;
  href: string;
  match: string[];
};

export type PrimaryNavSurface = "desktop" | "mobile";

const marketplaceMatch = [
  "/marketplace",
  "/cliente/marketplace",
  "/client/marketplace",
  "/produtos",
  "/carrinho",
  "/pedidos",
];

const eccopetMatch = [
  "/eccopet",
  "/ia",
  "/cliente/ia",
  "/cliente/assistente",
  "/client/eccopet",
  "/partner/eccopet",
  "/ngo/eccopet",
];

const communityMatch = ["/social", "/feed", "/client/social"];

/** Cinco destinos operacionais — usado por CLIENT / PARTNER / ONG. */
export const PRIMARY_NAVIGATION: PrimaryNavItem[] = [
  {
    id: "social",
    labelKey: "nav.socialNetwork",
    mobileLabelKey: "pub.nav.socialShort",
    icon: Users,
    href: "/social",
    match: communityMatch,
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
    match: marketplaceMatch,
  },
  {
    id: "eccopet",
    labelKey: "pub.nav.eccopet",
    mobileLabelKey: "pub.nav.eccopet",
    icon: Sparkles,
    href: "/eccopet",
    match: eccopetMatch,
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

/** Header desktop público: portas do ecossistema. /explorar permanece como rota. */
export const PUBLIC_DESKTOP_NAVIGATION: PrimaryNavItem[] = [
  {
    id: "marketplace",
    labelKey: "nav.marketplace",
    mobileLabelKey: "pub.nav.marketShort",
    icon: ShoppingBag,
    href: "/marketplace",
    match: marketplaceMatch,
  },
  {
    id: "services",
    labelKey: "nav.services",
    mobileLabelKey: "pub.nav.servicesShort",
    icon: Scissors,
    href: "/servicos",
    match: ["/servicos", "/marketplace/servicos"],
  },
  {
    id: "social",
    labelKey: "pub.nav.community",
    mobileLabelKey: "pub.nav.communityShort",
    icon: Users,
    href: "/social",
    match: communityMatch,
  },
  {
    id: "eccopet",
    labelKey: "pub.nav.eccopet",
    mobileLabelKey: "pub.nav.eccopet",
    icon: Sparkles,
    href: "/eccopet",
    match: eccopetMatch,
  },
  {
    id: "adoption",
    labelKey: "nav.adoption",
    mobileLabelKey: "pub.nav.adoptionShort",
    icon: Heart,
    href: "/adocao",
    match: ["/adocao"],
  },
];

/** Bottom nav pública: 5 itens, Marketplace permanece central. */
export const PUBLIC_MOBILE_NAVIGATION: PrimaryNavItem[] = [
  {
    id: "home",
    labelKey: "nav.home",
    mobileLabelKey: "pub.nav.homeShort",
    icon: Home,
    href: "/",
    match: [],
  },
  {
    id: "marketplace",
    labelKey: "nav.marketplace",
    mobileLabelKey: "pub.nav.marketShort",
    icon: ShoppingBag,
    href: "/marketplace",
    match: marketplaceMatch,
  },
  {
    id: "eccopet",
    labelKey: "pub.nav.eccopet",
    mobileLabelKey: "pub.nav.eccopet",
    icon: Sparkles,
    href: "/eccopet",
    match: eccopetMatch,
  },
  {
    id: "social",
    labelKey: "pub.nav.community",
    mobileLabelKey: "pub.nav.communityShort",
    icon: Users,
    href: "/social",
    match: communityMatch,
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

export function getPrimaryNavigation(
  context: PrimaryNavContext = "public",
  surface: PrimaryNavSurface = "mobile"
): PrimaryNavItem[] {
  if (context === "public") {
    return surface === "desktop" ? PUBLIC_DESKTOP_NAVIGATION : PUBLIC_MOBILE_NAVIGATION;
  }

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

  if (context === "partner") {
    return PRIMARY_NAVIGATION.map((item) =>
      item.id === "eccopet" ? { ...item, href: "/partner/eccopet" } : item
    );
  }

  if (context === "ong") {
    return PRIMARY_NAVIGATION.map((item) =>
      item.id === "eccopet" ? { ...item, href: "/ngo/eccopet" } : item
    );
  }

  return PRIMARY_NAVIGATION;
}

export function isPrimaryNavActive(pathname: string, item: PrimaryNavItem): boolean {
  if (item.id === "home") return pathname === "/";
  const candidates = [item.href, ...item.match];
  return candidates.some((prefix) => {
    if (prefix === "/") return pathname === "/";
    return pathname === prefix || pathname.startsWith(`${prefix}/`);
  });
}

export const PRIMARY_BOTTOM_NAV_CONTENT_PADDING =
  "pb-[calc(4.75rem+env(safe-area-inset-bottom))] lg:pb-8";
