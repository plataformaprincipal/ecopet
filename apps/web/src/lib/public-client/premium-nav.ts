import type { LucideIcon } from "lucide-react";
import {
  Compass,
  ShoppingBag,
  Sparkles,
  User,
  Users,
} from "lucide-react";

export type PremiumNavItem = {
  href: string;
  /** Chave i18n do rótulo desktop */
  labelKey: string;
  /** Chave i18n do rótulo curto mobile */
  mobileLabelKey: string;
  icon: LucideIcon;
  /** Exibir na barra inferior mobile (máx. 5) */
  mobile?: boolean;
};

/** Menu público premium — desktop completo */
export const PREMIUM_PUBLIC_NAV: PremiumNavItem[] = [
  { href: "/social", labelKey: "nav.socialNetwork", mobileLabelKey: "pub.nav.socialShort", icon: Users, mobile: true },
  { href: "/explorar", labelKey: "nav.explore", mobileLabelKey: "pub.nav.exploreShort", icon: Compass, mobile: true },
  { href: "/marketplace", labelKey: "nav.marketplace", mobileLabelKey: "pub.nav.marketShort", icon: ShoppingBag, mobile: true },
  { href: "/eccopet", labelKey: "pub.nav.eccopet", mobileLabelKey: "pub.nav.eccopet", icon: Sparkles, mobile: true },
  { href: "/perfil", labelKey: "nav.profile", mobileLabelKey: "pub.nav.profileShort", icon: User, mobile: true },
];

export const PREMIUM_MOBILE_NAV = PREMIUM_PUBLIC_NAV.filter((i) => i.mobile);

export function isPremiumNavActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  if (href === "/social") {
    return (
      pathname === "/social" ||
      pathname === "/feed" ||
      pathname.startsWith("/feed/") ||
      pathname.startsWith("/social/")
    );
  }
  if (href === "/marketplace") {
    return (
      pathname === "/marketplace" ||
      pathname.startsWith("/marketplace/") ||
      pathname.startsWith("/produtos") ||
      pathname.startsWith("/carrinho")
    );
  }
  if (href === "/eccopet") {
    return pathname === "/eccopet" || pathname === "/ia" || pathname.startsWith("/ia/");
  }
  if (href === "/perfil") {
    return pathname === "/perfil" || pathname === "/profile";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}
