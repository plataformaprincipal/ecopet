import type { AccountStatus, VerificationStatus } from "@prisma/client";
import { pathMatchesPrefix } from "@/lib/permissions";
import { partnerExperienceRouteRequiresApproval } from "@/lib/partner/experience-nav";

export type PartnerAccessLevel = "limited" | "full";

export type PartnerAccessContext = {
  accountStatus: AccountStatus;
  verificationStatus?: VerificationStatus | string | null;
  approvedAt?: Date | string | null;
};

/** Prefixos legados /parceiro/* que ainda exigem aprovação no shell antigo. */
const LEGACY_APPROVAL_REQUIRED_PREFIXES = [
  "/parceiro/marketplace",
  "/parceiro/agenda-servicos",
  "/parceiro/atividades-ia",
] as const;

/**
 * Acesso comercial completo só com ACTIVE + APPROVED (+ approvedAt quando informado).
 * Conta recém-cadastrada (PENDING) permanece limited.
 */
export function getPartnerAccessLevel(ctx: PartnerAccessContext): PartnerAccessLevel {
  if (ctx.accountStatus === "SUSPENDED" || ctx.accountStatus === "REJECTED") {
    return "limited";
  }
  const approved =
    ctx.accountStatus === "ACTIVE" &&
    ctx.verificationStatus === "APPROVED" &&
    (ctx.approvedAt === undefined || ctx.approvedAt != null);
  if (approved) return "full";
  return "limited";
}

export function partnerRouteRequiresApproval(pathname: string): boolean {
  if (pathname === "/partner" || pathname.startsWith("/partner/")) {
    return partnerExperienceRouteRequiresApproval(pathname);
  }
  return LEGACY_APPROVAL_REQUIRED_PREFIXES.some((p) => pathMatchesPrefix(pathname, p));
}

export function canAccessPartnerRoute(
  pathname: string,
  accessLevel: PartnerAccessLevel
): boolean {
  if (accessLevel === "full") return true;
  if (partnerRouteRequiresApproval(pathname)) return false;
  return true;
}

export function partnerApprovalLabel(
  accountStatus: AccountStatus,
  verificationStatus?: string | null
): string {
  if (accountStatus === "SUSPENDED") return "Suspenso";
  if (accountStatus === "REJECTED" || verificationStatus === "REJECTED") return "Recusado";
  if (accountStatus === "ACTIVE" && verificationStatus === "APPROVED") return "Aprovado";
  return "Pendente";
}
