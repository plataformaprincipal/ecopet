import type { AccountStatus, VerificationStatus } from "@prisma/client";
import { pathMatchesPrefix } from "@/lib/permissions";

export type OngAccessLevel = "limited" | "full" | "blocked";

export type OngAccessContext = {
  accountStatus: AccountStatus;
  verificationStatus?: VerificationStatus | string | null;
};

const APPROVAL_REQUIRED_PREFIXES = [
  "/ong/comunidade",
  "/ong/adocoes",
  "/ong/atividades-ia",
] as const;

export function getOngAccessLevel(ctx: OngAccessContext): OngAccessLevel {
  if (ctx.accountStatus === "SUSPENDED" || ctx.accountStatus === "REJECTED") {
    return "blocked";
  }
  // Registration rule: ACTIVE ONG has immediate institutional access.
  if (ctx.accountStatus === "ACTIVE") return "full";
  return "limited";
}

export function ongRouteRequiresApproval(pathname: string): boolean {
  return APPROVAL_REQUIRED_PREFIXES.some((p) => pathMatchesPrefix(pathname, p));
}

export function canAccessOngRoute(pathname: string, accessLevel: OngAccessLevel): boolean {
  if (accessLevel === "blocked") {
    return pathMatchesPrefix(pathname, "/ong/perfil-gestao");
  }
  if (accessLevel === "full") return true;
  if (ongRouteRequiresApproval(pathname)) return false;
  return true;
}

export function ongApprovalLabel(
  accountStatus: AccountStatus,
  verificationStatus?: string | null
): string {
  if (accountStatus === "SUSPENDED") return "Suspenso";
  if (accountStatus === "REJECTED" || verificationStatus === "REJECTED") return "Recusado";
  if (accountStatus === "ACTIVE" && verificationStatus === "APPROVED") return "Aprovado";
  return "Pendente";
}
