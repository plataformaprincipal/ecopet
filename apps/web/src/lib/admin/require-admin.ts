import { AccountStatus, UserRole } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth";
import { apiFailure } from "@/lib/api-response";

export async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user) {
    return { user: null, error: apiFailure("UNAUTHORIZED", "Sessão expirada. Faça login novamente.", 401) };
  }
  if (user.role !== UserRole.ADMIN) {
    return { user: null, error: apiFailure("FORBIDDEN", "Acesso restrito a administradores.", 403) };
  }
  if (user.accountStatus !== AccountStatus.ACTIVE) {
    return {
      user: null,
      error: apiFailure(
        "FORBIDDEN",
        "Conta administrativa inativa. Entre em contato com o suporte da plataforma.",
        403
      ),
    };
  }
  return { user, error: null };
}
