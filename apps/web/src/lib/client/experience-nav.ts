import type { LucideIcon } from "lucide-react";
import {
  Home,
  Users,
  Compass,
  ShoppingBag,
  Scissors,
  Sparkles,
  PawPrint,
  ShoppingCart,
  Package,
  CalendarDays,
  MessageSquare,
  Bell,
  User,
} from "lucide-react";

export type ClientExperienceNavItem = {
  href: string;
  /** Chave i18n em clientArea.nav.* */
  labelKey: string;
  icon: LucideIcon;
};

/** Navegação completa da experiência do cliente logado (/client/*). */
export const CLIENT_EXPERIENCE_NAV: ClientExperienceNavItem[] = [
  { href: "/client", labelKey: "clientArea.nav.home", icon: Home },
  { href: "/client/social", labelKey: "clientArea.nav.social", icon: Users },
  { href: "/client/explore", labelKey: "clientArea.nav.explore", icon: Compass },
  { href: "/client/marketplace", labelKey: "clientArea.nav.marketplace", icon: ShoppingBag },
  { href: "/client/services", labelKey: "clientArea.nav.services", icon: Scissors },
  { href: "/client/eccopet", labelKey: "clientArea.nav.ai", icon: Sparkles },
  { href: "/client/my-pet", labelKey: "clientArea.nav.myPet", icon: PawPrint },
  { href: "/client/cart", labelKey: "clientArea.nav.cart", icon: ShoppingCart },
  { href: "/client/orders", labelKey: "clientArea.nav.orders", icon: Package },
  { href: "/client/appointments", labelKey: "clientArea.nav.appointments", icon: CalendarDays },
  { href: "/client/messages", labelKey: "clientArea.nav.messages", icon: MessageSquare },
  { href: "/client/notifications", labelKey: "clientArea.nav.notifications", icon: Bell },
  { href: "/client/profile", labelKey: "clientArea.nav.profile", icon: User },
];

/** Itens da bottom navigation mobile (5 atalhos). */
export const CLIENT_EXPERIENCE_BOTTOM_NAV: ClientExperienceNavItem[] = [
  { href: "/client/social", labelKey: "clientArea.nav.social", icon: Users },
  { href: "/client/explore", labelKey: "clientArea.nav.explore", icon: Compass },
  { href: "/client/marketplace", labelKey: "clientArea.nav.marketplace", icon: ShoppingBag },
  { href: "/client/eccopet", labelKey: "clientArea.nav.ai", icon: Sparkles },
  { href: "/client/profile", labelKey: "clientArea.nav.profile", icon: User },
];

/** Rotas imersivas: ocupam toda a área central (sem painel direito / largura plena). */
export const CLIENT_IMMERSIVE_ROUTES = ["/client/eccopet", "/client/messages"];

/** Rotas que exibem o painel direito de contexto. */
export const CLIENT_RIGHT_PANEL_ROUTES = ["/client", "/client/social"];

export function isClientExperienceNavActive(pathname: string, href: string): boolean {
  if (href === "/client") return pathname === "/client";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function isClientExperiencePath(pathname: string): boolean {
  return pathname === "/client" || pathname.startsWith("/client/");
}
