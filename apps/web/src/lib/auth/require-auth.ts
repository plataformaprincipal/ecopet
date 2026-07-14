import { UserRole } from "@prisma/client";
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

export async function requireActivePartner() {
  return requirePartner();
}

/**
 * Parceiro autenticado com conta ACTIVE.
 * Document verification (PartnerProfile.verificationStatus) may remain PENDING
 * for KYC/docs without blocking commercial operations — registration rule:
 * PARTNER ACTIVE + immediate use, no mandatory manual approval.
 */
export async function requireApprovedPartner() {
  return requirePartner();
}

export async function requireClient() {
  return requireRole(UserRole.CLIENT);
}

export async function requireOng() {
  return requireNgo();
}
