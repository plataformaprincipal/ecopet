import { apiFailure, apiSuccess } from "@/lib/api-response";
import { requireRole } from "@/lib/auth/require-auth";
import { UserRole } from "@prisma/client";
import { checkRateLimit } from "@/lib/rate-limit";
import { getMercadoPagoAdminDiagnostics } from "@/lib/mercado-pago/admin-diagnostics";

export const dynamic = "force-dynamic";

/** GET — diagnóstico ADMIN Mercado Pago (sem cobrança). ?probe=1 para ping auth. */
export async function GET(request: Request) {
  const { user, error } = await requireRole(UserRole.ADMIN);
  if (error) return error;

  if (!checkRateLimit(`mp-diag:${user!.id}`, 20, 60_000)) {
    return apiFailure("RATE_LIMIT", "Limite de diagnósticos.", 429);
  }

  const url = new URL(request.url);
  const probe = url.searchParams.get("probe") === "1";

  const data = await getMercadoPagoAdminDiagnostics({ probe });
  return apiSuccess(data);
}
