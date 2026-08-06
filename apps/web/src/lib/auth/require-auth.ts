import { AccountStatus, UserRole, VerificationStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { apiFailure } from "@/lib/api-response";
import {
  requireAuth as requireAuthenticatedUser,
  requireRole,
  requirePartner,
  requireNgo,
  type ApiGuardResult,
} from "@/lib/auth/guards";

export {
  requireRole,
  requirePartner,
  requireNgo,
  guardAuth,
  guardRole,
  guardAdmin,
  guardPartner,
  guardNgo,
} from "@/lib/auth/guards";

export type { ApiGuardResult, GuardUser } from "@/lib/auth/guards";

export const PARTNER_PENDING_APPROVAL_MESSAGE =
  "Sua conta de parceiro está em análise. Você poderá cadastrar produtos e serviços após a aprovação.";
export const ONG_PENDING_APPROVAL_MESSAGE =
  "Sua conta de ONG está em análise. Você terá acesso completo após a aprovação.";

/** API guard — autenticado; com papéis opcionais delega para requireRole. */
export async function requireAuth(allowedRoles?: UserRole[]): Promise<ApiGuardResult> {
  if (allowedRoles?.length) {
    return requireRole(...allowedRoles);
  }
  return requireAuthenticatedUser();
}

/**
 * Parceiro com acesso operacional:
 * role=PARTNER + accountStatus=ACTIVE + verificationStatus=APPROVED + approvedAt.
 */
export async function requireApprovedPartner(): Promise<ApiGuardResult> {
  const base = await requirePartner();
  if (base.error || !base.user) return base;

  if (base.user.accountStatus !== AccountStatus.ACTIVE) {
    return {
      user: null,
      error: apiFailure("FORBIDDEN", PARTNER_PENDING_APPROVAL_MESSAGE, 403),
    };
  }

  const profile = await prisma.partnerProfile.findUnique({
    where: { userId: base.user.id },
    select: { verificationStatus: true, approvedAt: true },
  });

  if (
    !profile ||
    profile.verificationStatus !== VerificationStatus.APPROVED ||
    !profile.approvedAt
  ) {
    return {
      user: null,
      error: apiFailure("FORBIDDEN", PARTNER_PENDING_APPROVAL_MESSAGE, 403),
    };
  }

  return base;
}

/** Alias operacional — mesmas regras de aprovação (não basta ACTIVE). */
export async function requireActivePartner() {
  return requireApprovedPartner();
}

export async function requireClient() {
  return requireRole(UserRole.CLIENT);
}

export async function requireOng() {
  return requireNgo();
}
