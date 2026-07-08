import { UserRole, VerificationStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
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
 * Parceiro com verificação aprovada. Usado para operações comerciais
 * (cadastrar/editar produtos e serviços). Contas PENDING ficam bloqueadas
 * até a aprovação do administrador.
 */
export async function requireApprovedPartner() {
  const result = await requirePartner();
  if (result.error || !result.user) return result;

  const profile = await prisma.partnerProfile.findUnique({
    where: { userId: result.user.id },
    select: { verificationStatus: true },
  });

  if (!profile || profile.verificationStatus !== VerificationStatus.APPROVED) {
    const { apiFailure } = await import("@/lib/api-response");
    return {
      user: null,
      error: apiFailure("ACCOUNT_PENDING_APPROVAL", PARTNER_PENDING_APPROVAL_MESSAGE, 403),
    };
  }

  return result;
}

export async function requireClient() {
  return requireRole(UserRole.CLIENT);
}

export async function requireOng() {
  return requireNgo();
}
