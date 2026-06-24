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
  label: string;
  icon: LucideIcon;
  /** Label curto na barra mobile */
  mobileLabel?: string;
  /** Exibir na barra inferior mobile (máx. 5) */
  mobile?: boolean;
};

/** Menu público premium — desktop completo */
export const PREMIUM_PUBLIC_NAV: PremiumNavItem[] = [
  { href: "/social", label: "Rede Social", mobileLabel: "Social", icon: Users, mobile: true },
  { href: "/explorar", label: "Explorar", mobileLabel: "Explorar", icon: Compass, mobile: true },
  { href: "/marketplace", label: "Marketplace", mobileLabel: "Mercado", icon: ShoppingBag, mobile: true },
  { href: "/eccopet", label: "EccoPet", mobileLabel: "EccoPet", icon: Sparkles, mobile: true },
  { href: "/perfil", label: "Perfil", mobileLabel: "Perfil", icon: User, mobile: true },
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
