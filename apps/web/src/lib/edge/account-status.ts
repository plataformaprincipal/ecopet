/**
 * Regras de accountStatus para Edge Runtime (middleware).
 * Espelha lib/account-status.ts — manter sincronizado ao alterar regras.
 */
import type { AccountStatus, AppRole } from "@/lib/edge/types";
import { pathMatchesPrefix } from "@/lib/edge/permissions";

export const ACCOUNT_STATUS_PAGES = {
  PENDING_REVIEW: "/conta/em-analise",
  REJECTED: "/conta/rejeitada",
  SUSPENDED: "/conta/suspensa",
} as const;

export const PENDING_ALLOWED_PREFIXES = [
  "/dashboard",
  "/dashboard/client",
  "/dashboard/client/profile",
  "/dashboard/client/pets",
  "/dashboard/client/services",
  "/dashboard/client/appointments",
  "/dashboard/partner/services",
  "/dashboard/partner/availability",
  "/dashboard/partner/appointments",
  "/api/client",
  "/api/partner",
  "/dashboard/partner",
  "/dashboard/partner/profile",
  "/parceiro",
  "/parceiro/comunidade",
  "/parceiro/perfil-gestao",
  "/api/partner/dashboard",
  "/dashboard/ong",
  "/dashboard/ong/profile",
  "/ong",
  "/ong/perfil-gestao",
  "/api/ong",
  "/perfil",
  "/configuracoes",
  "/conta/em-analise",
  "/conta/rejeitada",
  "/conta/suspensa",
  "/api/profile",
  "/api/auth/me",
  "/api/auth/logout",
] as const;

export const PARTNER_PENDING_BLOCKED_PREFIXES = [
  "/marketplace",
  "/pedidos",
  "/agenda",
] as const;

export const ONG_PENDING_BLOCKED_PREFIXES = [
  "/adocao",
  "/ong/comunidade",
  "/ong/adocoes",
  "/ong/atividades-ia",
] as const;

export type AccountAccessResult = {
  allowed: boolean;
  redirectTo?: string;
  code?: "SUSPENDED" | "REJECTED" | "PENDING_LIMITED";
};

export function canAccessWithAccountStatus(
  role: AppRole,
  accountStatus: AccountStatus,
  pathname: string
): AccountAccessResult {
  if (accountStatus === "SUSPENDED") {
    if (pathname === ACCOUNT_STATUS_PAGES.SUSPENDED) return { allowed: true };
    return {
      allowed: false,
      redirectTo: ACCOUNT_STATUS_PAGES.SUSPENDED,
      code: "SUSPENDED",
    };
  }

  if (accountStatus === "REJECTED") {
    if (pathname === ACCOUNT_STATUS_PAGES.REJECTED) return { allowed: true };
    return {
      allowed: false,
      redirectTo: ACCOUNT_STATUS_PAGES.REJECTED,
      code: "REJECTED",
    };
  }

  if (accountStatus === "PENDING") {
    if (pathname === ACCOUNT_STATUS_PAGES.PENDING_REVIEW) return { allowed: true };

    const blockedForRole =
      (role === "PARTNER" &&
        PARTNER_PENDING_BLOCKED_PREFIXES.some((p) => pathMatchesPrefix(pathname, p))) ||
      (role === "ONG" &&
        ONG_PENDING_BLOCKED_PREFIXES.some((p) => pathMatchesPrefix(pathname, p)));

    if (blockedForRole) {
      return {
        allowed: false,
        redirectTo: ACCOUNT_STATUS_PAGES.PENDING_REVIEW,
        code: "PENDING_LIMITED",
      };
    }

    return { allowed: true };
  }

  return { allowed: true };
}
