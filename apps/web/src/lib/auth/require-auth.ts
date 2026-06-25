import { UserRole, VerificationStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { getAuthoritativeAccountStatus } from "@/lib/account-status-server";
import { apiFailure } from "@/lib/api-response";

export const PARTNER_PENDING_APPROVAL_MESSAGE =
  "Sua conta de parceiro está em análise. Você poderá cadastrar produtos e serviços após a aprovação.";
export const ONG_PENDING_APPROVAL_MESSAGE =
  "Sua conta de ONG está em análise. Você terá acesso completo após a aprovação.";

export async function requireAuth(allowedRoles?: UserRole[]) {
  const user = await getCurrentUser();
  if (!user) {
    return { user: null, error: apiFailure("UNAUTHORIZED", "Sessão expirada.", 401) };
  }

  const authoritative = await getAuthoritativeAccountStatus(user.id);
  if (!authoritative) {
    return { user: null, error: apiFailure("UNAUTHORIZED", "Usuário não encontrado.", 401) };
  }

  if (authoritative.accountStatus === "SUSPENDED") {
    return { user: null, error: apiFailure("ACCOUNT_SUSPENDED", "Conta suspensa.", 403) };
  }
  if (authoritative.accountStatus === "REJECTED") {
    return { user: null, error: apiFailure("ACCOUNT_REJECTED", "Conta rejeitada.", 403) };
  }

  if (allowedRoles && !allowedRoles.includes(authoritative.role)) {
    return { user: null, error: apiFailure("FORBIDDEN", "Sem permissão.", 403) };
  }

  return { user: { ...user, accountStatus: authoritative.accountStatus, role: authoritative.role }, error: null };
}

export async function requireActivePartner() {
  return requireAuth([UserRole.PARTNER]);
}

/**
 * Parceiro com verificação aprovada. Usado para operações comerciais
 * (cadastrar/editar produtos e serviços). Contas PENDING ficam bloqueadas
 * até a aprovação do administrador.
 */
export async function requireApprovedPartner() {
  const result = await requireAuth([UserRole.PARTNER]);
  if (result.error || !result.user) return result;

  const profile = await prisma.partnerProfile.findUnique({
    where: { userId: result.user.id },
    select: { verificationStatus: true },
  });

  if (!profile || profile.verificationStatus !== VerificationStatus.APPROVED) {
    return {
      user: null,
      error: apiFailure("ACCOUNT_PENDING_APPROVAL", PARTNER_PENDING_APPROVAL_MESSAGE, 403),
    };
  }

  return result;
}

export async function requireClient() {
  return requireAuth([UserRole.CLIENT]);
}

export async function requireOng() {
  return requireAuth([UserRole.ONG]);
}
