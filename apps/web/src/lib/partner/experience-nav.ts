import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Users,
  Store,
  Package,
  Scissors,
  ShoppingBag,
  CalendarDays,
  UsersRound,
  MessageSquare,
  Bell,
  Sparkles,
  Building2,
  Settings,
} from "lucide-react";

export type PartnerExperienceNavItem = {
  href: string;
  /** Chave i18n em partnerArea.nav.* */
  labelKey: string;
  icon: LucideIcon;
  /** Exige parceiro aprovado (accessLevel "full"). */
  requiresApproval: boolean;
};

/** Navegação completa do painel do parceiro (/partner/*). */
export const PARTNER_EXPERIENCE_NAV: PartnerExperienceNavItem[] = [
  { href: "/partner", labelKey: "partnerArea.nav.overview", icon: LayoutDashboard, requiresApproval: false },
  { href: "/partner/social", labelKey: "partnerArea.nav.social", icon: UsersRound, requiresApproval: false },
  { href: "/partner/marketplace", labelKey: "partnerArea.nav.marketplace", icon: Store, requiresApproval: true },
  { href: "/partner/products", labelKey: "partnerArea.nav.products", icon: Package, requiresApproval: true },
  { href: "/partner/services", labelKey: "partnerArea.nav.services", icon: Scissors, requiresApproval: true },
  { href: "/partner/orders", labelKey: "partnerArea.nav.orders", icon: ShoppingBag, requiresApproval: true },
  { href: "/partner/appointments", labelKey: "partnerArea.nav.appointments", icon: CalendarDays, requiresApproval: true },
  { href: "/partner/customers", labelKey: "partnerArea.nav.customers", icon: Users, requiresApproval: true },
  { href: "/partner/messages", labelKey: "partnerArea.nav.messages", icon: MessageSquare, requiresApproval: false },
  { href: "/partner/notifications", labelKey: "partnerArea.nav.notifications", icon: Bell, requiresApproval: false },
  { href: "/partner/eccopet", labelKey: "partnerArea.nav.ai", icon: Sparkles, requiresApproval: true },
  { href: "/partner/profile", labelKey: "partnerArea.nav.profile", icon: Building2, requiresApproval: false },
  { href: "/partner/settings", labelKey: "partnerArea.nav.settings", icon: Settings, requiresApproval: false },
];

/** Bottom navigation mobile (5 atalhos). */
export const PARTNER_EXPERIENCE_BOTTOM_NAV: PartnerExperienceNavItem[] = [
  { href: "/partner", labelKey: "partnerArea.nav.overview", icon: LayoutDashboard, requiresApproval: false },
  { href: "/partner/products", labelKey: "partnerArea.nav.products", icon: Package, requiresApproval: true },
  { href: "/partner/orders", labelKey: "partnerArea.nav.orders", icon: ShoppingBag, requiresApproval: true },
  { href: "/partner/appointments", labelKey: "partnerArea.nav.appointments", icon: CalendarDays, requiresApproval: true },
  { href: "/partner/eccopet", labelKey: "partnerArea.nav.ai", icon: Sparkles, requiresApproval: true },
];

/** Prefixos /partner/* que exigem parceiro aprovado. */
export const PARTNER_APPROVAL_REQUIRED_PREFIXES = PARTNER_EXPERIENCE_NAV.filter(
  (i) => i.requiresApproval
).map((i) => i.href);

/** Rotas imersivas (largura plena, sem painel direito). */
export const PARTNER_IMMERSIVE_ROUTES = ["/partner/eccopet", "/partner/messages"];

/** Rotas que exibem painel direito de contexto. */
export const PARTNER_RIGHT_PANEL_ROUTES = ["/partner", "/partner/social"];

export function isPartnerExperienceNavActive(pathname: string, href: string): boolean {
  if (href === "/partner") return pathname === "/partner";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function isPartnerExperiencePath(pathname: string): boolean {
  return pathname === "/partner" || pathname.startsWith("/partner/");
}

/** Rota /partner/* exige aprovação? */
export function partnerExperienceRouteRequiresApproval(pathname: string): boolean {
  return PARTNER_APPROVAL_REQUIRED_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );
}
