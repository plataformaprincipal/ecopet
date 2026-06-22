import type { AccountStatus, VerificationStatus } from "@prisma/client";
import { pathMatchesPrefix } from "@/lib/permissions";

export type PartnerAccessLevel = "limited" | "full";

export type PartnerAccessContext = {
  accountStatus: AccountStatus;
  verificationStatus?: VerificationStatus | string | null;
};

const APPROVAL_REQUIRED_PREFIXES = [
  "/parceiro/marketplace",
  "/parceiro/agenda-servicos",
  "/parceiro/atividades-ia",
] as const;

export function getPartnerAccessLevel(ctx: PartnerAccessContext): PartnerAccessLevel {
  const approved =
    ctx.accountStatus === "ACTIVE" && ctx.verificationStatus === "APPROVED";
  return approved ? "full" : "limited";
}

export function partnerRouteRequiresApproval(pathname: string): boolean {
  return APPROVAL_REQUIRED_PREFIXES.some((p) => pathMatchesPrefix(pathname, p));
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
