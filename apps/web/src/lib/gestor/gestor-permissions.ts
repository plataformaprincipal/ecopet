import { requireAdmin } from "@/lib/auth/guards";

/** Alias explícito para o Painel Gestor BI (Etapa 12) — somente ADMIN ACTIVE. */
export async function requireGestorAdmin(request?: Request) {
  return requireAdmin({ path: request ? new URL(request.url).pathname : "/api/admin/gestor" });
}
