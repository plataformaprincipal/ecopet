import type { LucideIcon } from "lucide-react";
import {
  Home,
  ShoppingBag,
  PawPrint,
  User,
  LayoutDashboard,
  ClipboardList,
  Heart,
  MessageCircle,
  Shield,
  Users,
  Settings,
  ShoppingCart,
  Wrench,
} from "lucide-react";
import type { TranslationKey } from "@/lib/i18n/types";
import type { AppRole } from "@/lib/permissions";
import { isNavActive, type MainNavItem } from "@/lib/navigation/main-nav";

export type RoleNavItem = MainNavItem;

export type RoleSecondaryNavItem = {
  href: string;
  labelKey: TranslationKey;
  icon: LucideIcon;
};

const CLIENT_MAIN: RoleNavItem[] = [
  { href: "/", labelKey: "nav.home", icon: Home, match: ["/", "/inicio", "/feed"] },
  { href: "/marketplace", labelKey: "nav.marketplace", icon: ShoppingBag, match: ["/marketplace"] },
  {
    href: "/dashboard/client",
    labelKey: "nav.myDashboard",
    icon: LayoutDashboard,
    match: ["/dashboard", "/dashboard/client"],
  },
  {
    href: "/dashboard/client/pets",
    labelKey: "nav.pets",
    icon: PawPrint,
    match: ["/dashboard/client/pets", "/meu-pet", "/pets"],
  },
  { href: "/carrinho", labelKey: "nav.cart", icon: ShoppingCart, match: ["/carrinho", "/checkout"] },
];

const CLIENT_SECONDARY: RoleSecondaryNavItem[] = [
  { href: "/perfil", labelKey: "nav.profile", icon: User },
  { href: "/dashboard/messages", labelKey: "nav.messages", icon: MessageCircle },
  { href: "/dashboard/support", labelKey: "nav.support", icon: ClipboardList },
  { href: "/configuracoes", labelKey: "nav.settings", icon: Settings },
];

const PARTNER_MAIN: RoleNavItem[] = [
  { href: "/", labelKey: "nav.home", icon: Home, match: ["/", "/inicio"] },
  { href: "/marketplace", labelKey: "nav.marketplace", icon: ShoppingBag, match: ["/marketplace"] },
  {
    href: "/dashboard/partner",
    labelKey: "nav.myDashboard",
    icon: LayoutDashboard,
    match: ["/dashboard/partner"],
  },
  {
    href: "/dashboard/partner/services",
    labelKey: "nav.services",
    icon: Wrench,
    match: ["/dashboard/partner/services"],
  },
  {
    href: "/dashboard/partner/orders",
    labelKey: "nav.orders",
    icon: ClipboardList,
    match: ["/dashboard/partner/orders", "/pedidos"],
  },
];

const PARTNER_SECONDARY: RoleSecondaryNavItem[] = [
  { href: "/perfil", labelKey: "nav.profile", icon: User },
  { href: "/dashboard/messages", labelKey: "nav.messages", icon: MessageCircle },
  { href: "/dashboard/support", labelKey: "nav.support", icon: ClipboardList },
  { href: "/configuracoes", labelKey: "nav.settings", icon: Settings },
];

const ONG_MAIN: RoleNavItem[] = [
  { href: "/", labelKey: "nav.home", icon: Home, match: ["/", "/inicio"] },
  { href: "/adocao", labelKey: "nav.adoption", icon: Heart, match: ["/adocao", "/ong"] },
  {
    href: "/dashboard/ong",
    labelKey: "nav.myDashboard",
    icon: LayoutDashboard,
    match: ["/dashboard/ong"],
  },
  { href: "/dashboard/ong/profile", labelKey: "nav.profile", icon: User, match: ["/dashboard/ong/profile", "/perfil"] },
  { href: "/dashboard/messages", labelKey: "nav.messages", icon: MessageCircle, match: ["/dashboard/messages", "/social/mensagens"] },
];

const ONG_SECONDARY: RoleSecondaryNavItem[] = [
  { href: "/dashboard/support", labelKey: "nav.support", icon: ClipboardList },
  { href: "/configuracoes", labelKey: "nav.settings", icon: Settings },
];

const ADMIN_MAIN: RoleNavItem[] = [
  { href: "/dashboard/admin", labelKey: "nav.adminPanel", icon: Shield, match: ["/dashboard/admin", "/gestor", "/admin"] },
  { href: "/gestor/permissions", labelKey: "nav.users", icon: Users, match: ["/gestor/permissions", "/dashboard/admin/accounts"] },
  {
    href: "/dashboard/admin/integrations",
    labelKey: "nav.integrations",
    icon: Settings,
    match: ["/dashboard/admin/integrations", "/gestor/integrations"],
  },
  { href: "/dashboard/admin/orders", labelKey: "nav.orders", icon: ClipboardList, match: ["/dashboard/admin/orders"] },
  { href: "/perfil", labelKey: "nav.profile", icon: User, match: ["/perfil"] },
];

const ADMIN_SECONDARY: RoleSecondaryNavItem[] = [
  { href: "/dashboard/admin/support", labelKey: "nav.support", icon: ClipboardList },
  { href: "/dashboard/admin/messages/reports", labelKey: "nav.reports", icon: Shield },
  { href: "/configuracoes", labelKey: "nav.settings", icon: Settings },
];

export function getNavigationForRole(role: AppRole | null | undefined): {
  main: RoleNavItem[];
  secondary: RoleSecondaryNavItem[];
} {
  switch (role) {
    case "PARTNER":
      return { main: PARTNER_MAIN, secondary: PARTNER_SECONDARY };
    case "ONG":
      return { main: ONG_MAIN, secondary: ONG_SECONDARY };
    case "ADMIN":
      return { main: ADMIN_MAIN, secondary: ADMIN_SECONDARY };
    case "CLIENT":
    default:
      return { main: CLIENT_MAIN, secondary: CLIENT_SECONDARY };
  }
}

export { isNavActive };
