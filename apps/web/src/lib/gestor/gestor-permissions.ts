import { requireAdmin } from "@/lib/admin/require-admin";

/** Alias explícito para o Painel Gestor BI (Etapa 12) — somente ADMIN. */
export async function requireGestorAdmin() {
  return requireAdmin();
}
