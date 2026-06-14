import type { LucideIcon } from "lucide-react";
import {
  Home,
  Compass,
  ShoppingBag,
  PawPrint,
  User,
  LayoutDashboard,
  Package,
  ClipboardList,
  Heart,
  Megaphone,
  Gift,
  MessageCircle,
  Bell,
  Sparkles,
  Calendar,
  Shield,
  Users,
  Building2,
  FileText,
  Settings,
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
  { href: "/dashboard", labelKey: "nav.home", icon: Home, match: ["/dashboard", "/inicio"] },
  { href: "/perfil", labelKey: "nav.profile", icon: User, match: ["/perfil"] },
  { href: "/meu-pet", labelKey: "nav.myPet", icon: PawPrint, match: ["/meu-pet", "/pets", "/health", "/iot"] },
  { href: "/explorar", labelKey: "nav.socialNetwork", icon: Compass, match: ["/explorar", "/feed", "/social"] },
  { href: "/marketplace", labelKey: "nav.marketplace", icon: ShoppingBag, match: ["/marketplace"] },
];

const CLIENT_SECONDARY: RoleSecondaryNavItem[] = [
  { href: "/ia", labelKey: "nav.ai", icon: Sparkles },
  { href: "/agenda", labelKey: "nav.agenda", icon: Calendar },
  { href: "/social/mensagens", labelKey: "nav.messages", icon: MessageCircle },
  { href: "/notificacoes", labelKey: "nav.notifications", icon: Bell },
  { href: "/configuracoes", labelKey: "nav.settings", icon: Settings },
];

const PARTNER_MAIN: RoleNavItem[] = [
  { href: "/dashboard", labelKey: "nav.home", icon: LayoutDashboard, match: ["/dashboard"] },
  { href: "/perfil", labelKey: "nav.profile", icon: User, match: ["/perfil"] },
  { href: "/marketplace", labelKey: "nav.products", icon: Package, match: ["/marketplace"] },
  { href: "/pedidos", labelKey: "nav.orders", icon: ClipboardList, match: ["/pedidos"] },
];

const PARTNER_SECONDARY: RoleSecondaryNavItem[] = [
  { href: "/agenda", labelKey: "nav.agenda", icon: Calendar },
  { href: "/social/mensagens", labelKey: "nav.messages", icon: MessageCircle },
  { href: "/notificacoes", labelKey: "nav.notifications", icon: Bell },
  { href: "/configuracoes", labelKey: "nav.settings", icon: Settings },
];

const ONG_MAIN: RoleNavItem[] = [
  { href: "/dashboard", labelKey: "nav.home", icon: LayoutDashboard, match: ["/dashboard", "/dashboard/ong"] },
  { href: "/perfil", labelKey: "nav.profile", icon: User, match: ["/perfil"] },
  { href: "/adocao", labelKey: "nav.adoption", icon: Heart, match: ["/adocao", "/ong"] },
  { href: "/dashboard/ong", labelKey: "nav.campaigns", icon: Megaphone, match: ["/dashboard/ong"] },
];

const ONG_SECONDARY: RoleSecondaryNavItem[] = [
  { href: "/social/mensagens", labelKey: "nav.messages", icon: MessageCircle },
  { href: "/notificacoes", labelKey: "nav.notifications", icon: Bell },
  { href: "/configuracoes", labelKey: "nav.settings", icon: Settings },
];

const ADMIN_MAIN: RoleNavItem[] = [
  { href: "/gestor", labelKey: "nav.adminPanel", icon: Shield, match: ["/gestor", "/admin"] },
  { href: "/gestor/permissions", labelKey: "nav.users", icon: Users, match: ["/gestor/permissions"] },
  { href: "/gestor/integrations", labelKey: "nav.partners", icon: Building2, match: ["/gestor/integrations"] },
  { href: "/gestor/audit", labelKey: "nav.logs", icon: FileText, match: ["/gestor/audit"] },
];

const ADMIN_SECONDARY: RoleSecondaryNavItem[] = [
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
