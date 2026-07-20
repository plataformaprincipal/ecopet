import { UserRole } from "@prisma/client";
import { requireRole, type ApiGuardResult } from "@/lib/auth/guards";

/**
 * Acesso ao Centro de Inteligência.
 * Plataforma: UserRole.ADMIN (ACTIVE via requireRole).
 * RBAC futuro: códigos admin.bi.view / departamento BI / auditoria —
 * mapeados sobre ADMIN até o filtro de sidebar por permissão existir.
 */
export const BI_ALLOWED_ROLES = [UserRole.ADMIN] as const;

export async function requireBiAccess(): Promise<ApiGuardResult> {
  return requireRole(...BI_ALLOWED_ROLES);
}

export function canAccessBi(role: UserRole | string | undefined | null): boolean {
  return role === UserRole.ADMIN || role === "ADMIN";
}
