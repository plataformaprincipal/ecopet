import { apiSuccess, apiFailure } from "@/lib/api-response";
import { requireAdmin } from "@/lib/auth/guards";
import { checkRateLimit } from "@/lib/rate-limit";
import { getGoogleTagManagerAdminDiagnostics } from "@/lib/gtm/server-diagnostics";

export const dynamic = "force-dynamic";

/**
 * GET — diagnóstico ADMIN GTM (Container mascarado).
 */
export async function GET() {
  const { user, error } = await requireAdmin({
    path: "/api/admin/integrations/google-tag-manager/diagnostics",
  });
  if (error) return error;

  if (!checkRateLimit(`gtm-diag:${user!.id}`, 20, 60_000)) {
    return apiFailure("RATE_LIMIT", "Limite de requisições.", 429);
  }

  const base = getGoogleTagManagerAdminDiagnostics();
  return apiSuccess({
    ...base,
    governanceHref: "/admin/integracoes/google-tag-manager",
    governanceApi: "/api/admin/gtm/governance",
  });
}
