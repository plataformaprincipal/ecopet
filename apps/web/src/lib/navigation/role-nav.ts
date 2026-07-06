import type { LucideIcon } from "lucide-react";
import {
  Home,
  Compass,
  ShoppingBag,
  PawPrint,
  User,
  LayoutDashboard,
  ClipboardList,
  Heart,
  MessageCircle,
  Shield,
  Users,
  UsersRound,
  Settings,
  ShoppingCart,
  Wrench,
  Sparkles,
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
  { href: "/cliente", labelKey: "nav.home", icon: Home, match: ["/cliente", "/inicio"] },
  { href: "/cliente/explorar", labelKey: "nav.explore", icon: Compass, match: ["/cliente/explorar", "/explorar"] },
  { href: "/cliente/marketplace", labelKey: "nav.marketplace", icon: ShoppingBag, match: ["/cliente/marketplace", "/marketplace"] },
  { href: "/cliente/meu-pet", labelKey: "nav.myPet", icon: PawPrint, match: ["/cliente/meu-pet", "/meu-pet", "/pets"] },
  { href: "/cliente/perfil", labelKey: "nav.profile", icon: User, match: ["/cliente/perfil", "/perfil"] },
];

const CLIENT_SECONDARY: RoleSecondaryNavItem[] = [
  { href: "/dashboard/messages", labelKey: "nav.messages", icon: MessageCircle },
  { href: "/dashboard/client/orders", labelKey: "nav.orders", icon: ClipboardList },
  { href: "/carrinho", labelKey: "nav.cart", icon: ShoppingCart },
  { href: "/configuracoes", labelKey: "nav.settings", icon: Settings },
];

const PARTNER_MAIN: RoleNavItem[] = [
  {
    href: "/parceiro/comunidade",
    labelKey: "nav.home",
    icon: Home,
    match: ["/parceiro/comunidade", "/parceiro", "/feed"],
  },
  {
    href: "/parceiro/marketplace",
    labelKey: "nav.marketplace",
    icon: ShoppingBag,
    match: ["/parceiro/marketplace", "/marketplace"],
  },
  {
    href: "/parceiro/atividades-ia",
    labelKey: "nav.myDashboard",
    icon: LayoutDashboard,
    match: ["/parceiro/atividades-ia", "/dashboard/partner"],
  },
  {
    href: "/parceiro/agenda-servicos",
    labelKey: "nav.services",
    icon: Wrench,
    match: ["/parceiro/agenda-servicos", "/dashboard/partner/services", "/dashboard/partner/appointments"],
  },
  {
    href: "/parceiro/perfil-gestao",
    labelKey: "nav.profile",
    icon: User,
    match: ["/parceiro/perfil-gestao", "/perfil"],
  },
];

const PARTNER_SECONDARY: RoleSecondaryNavItem[] = [
  { href: "/perfil", labelKey: "nav.profile", icon: User },
  { href: "/dashboard/messages", labelKey: "nav.messages", icon: MessageCircle },
  { href: "/dashboard/support", labelKey: "nav.support", icon: ClipboardList },
  { href: "/configuracoes", labelKey: "nav.settings", icon: Settings },
];

const ONG_MAIN: RoleNavItem[] = [
  { href: "/ong", labelKey: "nav.myDashboard", icon: LayoutDashboard, match: ["/ong"] },
  { href: "/ong/comunidade", labelKey: "nav.community", icon: UsersRound, match: ["/ong/comunidade"] },
  { href: "/ong/adocoes", labelKey: "nav.adoption", icon: Heart, match: ["/ong/adocoes", "/adocao"] },
  { href: "/ong/atividades-ia", labelKey: "nav.aiActivities", icon: Sparkles, match: ["/ong/atividades-ia"] },
  { href: "/ong/perfil-gestao", labelKey: "nav.profile", icon: User, match: ["/ong/perfil-gestao", "/dashboard/ong/profile", "/perfil"] },
  { href: "/dashboard/messages", labelKey: "nav.messages", icon: MessageCircle, match: ["/dashboard/messages", "/social/mensagens"] },
];

const ONG_SECONDARY: RoleSecondaryNavItem[] = [
  { href: "/dashboard/support", labelKey: "nav.support", icon: ClipboardList },
  { href: "/configuracoes", labelKey: "nav.settings", icon: Settings },
];

const ADMIN_MAIN: RoleNavItem[] = [
  { href: "/admin", labelKey: "nav.adminPanel", icon: Shield, match: ["/admin", "/dashboard/admin", "/gestor"] },
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
