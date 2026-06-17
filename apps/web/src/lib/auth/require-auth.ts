import { UserRole } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth";
import { getAuthoritativeAccountStatus } from "@/lib/account-status-server";
import { apiFailure } from "@/lib/api-response";

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

export async function requireClient() {
  return requireAuth([UserRole.CLIENT]);
}
