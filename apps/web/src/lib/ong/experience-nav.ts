import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  UsersRound,
  PawPrint,
  Heart,
  Megaphone,
  HandHeart,
  MessageSquare,
  Bell,
  Sparkles,
  Building2,
  Settings,
  Gift,
  DollarSign,
  ClipboardList,
  Building,
  Handshake,
  Workflow,
  Plug,
  Users,
  BarChart3,
} from "lucide-react";

export type NgoExperienceNavItem = {
  href: string;
  labelKey: string;
  icon: LucideIcon;
  requiresApproval: boolean;
};

export const NGO_EXPERIENCE_NAV: NgoExperienceNavItem[] = [
  { href: "/ngo", labelKey: "ngoArea.nav.overview", icon: LayoutDashboard, requiresApproval: false },
  { href: "/ngo/dashboard", labelKey: "ngoArea.nav.dashboard", icon: BarChart3, requiresApproval: true },
  { href: "/ngo/animais", labelKey: "ngoArea.nav.animais", icon: PawPrint, requiresApproval: true },
  { href: "/ngo/adocoes", labelKey: "ngoArea.nav.adocoes", icon: Heart, requiresApproval: true },
  { href: "/ngo/doacoes", labelKey: "ngoArea.nav.doacoes", icon: Gift, requiresApproval: true },
  { href: "/ngo/campanhas", labelKey: "ngoArea.nav.campanhas", icon: Megaphone, requiresApproval: true },
  { href: "/ngo/social", labelKey: "ngoArea.nav.social", icon: UsersRound, requiresApproval: true },
  { href: "/ngo/voluntariado", labelKey: "ngoArea.nav.voluntariado", icon: Users, requiresApproval: true },
  { href: "/ngo/financeiro", labelKey: "ngoArea.nav.financeiro", icon: DollarSign, requiresApproval: true },
  { href: "/ngo/administrativo", labelKey: "ngoArea.nav.administrativo", icon: ClipboardList, requiresApproval: true },
  { href: "/ngo/espaco-fisico", labelKey: "ngoArea.nav.espacoFisico", icon: Building, requiresApproval: true },
  { href: "/ngo/parcerias", labelKey: "ngoArea.nav.parcerias", icon: Handshake, requiresApproval: true },
  { href: "/ngo/marketing", labelKey: "ngoArea.nav.marketing", icon: Megaphone, requiresApproval: true },
  { href: "/ngo/automacoes", labelKey: "ngoArea.nav.automacoes", icon: Workflow, requiresApproval: true },
  { href: "/ngo/integracoes", labelKey: "ngoArea.nav.integracoes", icon: Plug, requiresApproval: true },
  { href: "/ngo/supporters", labelKey: "ngoArea.nav.supporters", icon: HandHeart, requiresApproval: true },
  { href: "/ngo/messages", labelKey: "ngoArea.nav.messages", icon: MessageSquare, requiresApproval: false },
  { href: "/ngo/notifications", labelKey: "ngoArea.nav.notifications", icon: Bell, requiresApproval: false },
  { href: "/ngo/eccopet", labelKey: "ngoArea.nav.ai", icon: Sparkles, requiresApproval: true },
  { href: "/ngo/profile", labelKey: "ngoArea.nav.profile", icon: Building2, requiresApproval: false },
  { href: "/ngo/configuracoes", labelKey: "ngoArea.nav.configuracoes", icon: Settings, requiresApproval: false },
];

export const NGO_EXPERIENCE_BOTTOM_NAV: NgoExperienceNavItem[] = [
  { href: "/ngo", labelKey: "ngoArea.nav.overview", icon: LayoutDashboard, requiresApproval: false },
  { href: "/ngo/animais", labelKey: "ngoArea.nav.animais", icon: PawPrint, requiresApproval: true },
  { href: "/ngo/adocoes", labelKey: "ngoArea.nav.adocoes", icon: Heart, requiresApproval: true },
  { href: "/ngo/campanhas", labelKey: "ngoArea.nav.campanhas", icon: Megaphone, requiresApproval: true },
  { href: "/ngo/eccopet", labelKey: "ngoArea.nav.ai", icon: Sparkles, requiresApproval: true },
];

export const NGO_APPROVAL_REQUIRED_PREFIXES = NGO_EXPERIENCE_NAV.filter(
  (i) => i.requiresApproval
).map((i) => i.href);

export const NGO_IMMERSIVE_ROUTES = ["/ngo/eccopet", "/ngo/messages"];
export const NGO_RIGHT_PANEL_ROUTES = ["/ngo", "/ngo/social", "/ngo/dashboard"];

export function isNgoExperienceNavActive(pathname: string, href: string): boolean {
  if (href === "/ngo") return pathname === "/ngo";
  if (href === "/ngo/dashboard") return pathname === "/ngo/dashboard";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function isNgoExperiencePath(pathname: string): boolean {
  return pathname === "/ngo" || pathname.startsWith("/ngo/");
}

export function ngoExperienceRouteRequiresApproval(pathname: string): boolean {
  return NGO_APPROVAL_REQUIRED_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );
}
