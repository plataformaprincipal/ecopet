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
} from "lucide-react";

export type NgoExperienceNavItem = {
  href: string;
  /** Chave i18n em ngoArea.nav.* */
  labelKey: string;
  icon: LucideIcon;
  requiresApproval: boolean;
};

export const NGO_EXPERIENCE_NAV: NgoExperienceNavItem[] = [
  { href: "/ngo", labelKey: "ngoArea.nav.overview", icon: LayoutDashboard, requiresApproval: false },
  { href: "/ngo/social", labelKey: "ngoArea.nav.social", icon: UsersRound, requiresApproval: true },
  { href: "/ngo/animals", labelKey: "ngoArea.nav.animals", icon: PawPrint, requiresApproval: true },
  { href: "/ngo/adoptions", labelKey: "ngoArea.nav.adoptions", icon: Heart, requiresApproval: true },
  { href: "/ngo/campaigns", labelKey: "ngoArea.nav.campaigns", icon: Megaphone, requiresApproval: true },
  { href: "/ngo/supporters", labelKey: "ngoArea.nav.supporters", icon: HandHeart, requiresApproval: true },
  { href: "/ngo/messages", labelKey: "ngoArea.nav.messages", icon: MessageSquare, requiresApproval: false },
  { href: "/ngo/notifications", labelKey: "ngoArea.nav.notifications", icon: Bell, requiresApproval: false },
  { href: "/ngo/eccopet", labelKey: "ngoArea.nav.ai", icon: Sparkles, requiresApproval: true },
  { href: "/ngo/profile", labelKey: "ngoArea.nav.profile", icon: Building2, requiresApproval: false },
  { href: "/ngo/settings", labelKey: "ngoArea.nav.settings", icon: Settings, requiresApproval: false },
];

export const NGO_EXPERIENCE_BOTTOM_NAV: NgoExperienceNavItem[] = [
  { href: "/ngo", labelKey: "ngoArea.nav.overview", icon: LayoutDashboard, requiresApproval: false },
  { href: "/ngo/animals", labelKey: "ngoArea.nav.animals", icon: PawPrint, requiresApproval: true },
  { href: "/ngo/adoptions", labelKey: "ngoArea.nav.adoptions", icon: Heart, requiresApproval: true },
  { href: "/ngo/campaigns", labelKey: "ngoArea.nav.campaigns", icon: Megaphone, requiresApproval: true },
  { href: "/ngo/eccopet", labelKey: "ngoArea.nav.ai", icon: Sparkles, requiresApproval: true },
];

export const NGO_APPROVAL_REQUIRED_PREFIXES = NGO_EXPERIENCE_NAV.filter(
  (i) => i.requiresApproval
).map((i) => i.href);

export const NGO_IMMERSIVE_ROUTES = ["/ngo/eccopet", "/ngo/messages"];
export const NGO_RIGHT_PANEL_ROUTES = ["/ngo", "/ngo/social"];

export function isNgoExperienceNavActive(pathname: string, href: string): boolean {
  if (href === "/ngo") return pathname === "/ngo";
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
