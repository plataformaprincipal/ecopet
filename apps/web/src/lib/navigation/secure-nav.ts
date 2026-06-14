import { Home, ShoppingBag, LogIn, UserPlus, FileText, Shield } from "lucide-react";
import type { AppRole } from "@/lib/permissions";
import {
  getNavigationForRole,
  type RoleNavItem,
  type RoleSecondaryNavItem,
} from "@/lib/navigation/role-nav";

export type NavigationMode = "loading" | "unauthenticated" | "authenticated";

/** Navegação mínima enquanto a sessão carrega — nunca exibe módulos internos. */
export const loadingNav = {
  main: [] as RoleNavItem[],
  secondary: [] as RoleSecondaryNavItem[],
};

/** Visitante sem sessão confirmada — apenas rotas públicas seguras. */
export const unauthenticatedNav = {
  main: [
    { href: "/", labelKey: "nav.home" as const, icon: Home, match: ["/"] },
    {
      href: "/marketplace",
      labelKey: "nav.marketplace" as const,
      icon: ShoppingBag,
      match: ["/marketplace"],
    },
    { href: "/login", labelKey: "common.signIn" as const, icon: LogIn, match: ["/login"] },
    {
      href: "/cadastro",
      labelKey: "common.createAccount" as const,
      icon: UserPlus,
      match: ["/cadastro"],
    },
  ] satisfies RoleNavItem[],
  secondary: [
    { href: "/termos-de-uso", labelKey: "nav.termsOfUse" as const, icon: FileText },
    { href: "/politica-de-privacidade", labelKey: "nav.privacyPolicy" as const, icon: Shield },
  ] satisfies RoleSecondaryNavItem[],
};

export function getNavigationMode(loading: boolean, role: AppRole | null): NavigationMode {
  if (loading) return "loading";
  if (!role) return "unauthenticated";
  return "authenticated";
}

export function resolveNavigation(mode: NavigationMode, role?: AppRole | null) {
  if (mode === "loading") return loadingNav;
  if (mode === "unauthenticated") return unauthenticatedNav;
  return getNavigationForRole(role);
}

export function safeLogoHref(mode: NavigationMode, role: AppRole | null): string {
  if (mode !== "authenticated" || !role) return "/";
  return role === "ADMIN" ? "/gestor" : "/dashboard";
}
