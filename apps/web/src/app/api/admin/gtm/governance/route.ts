import { apiSuccess, apiFailure } from "@/lib/api-response";
import { requireAdmin } from "@/lib/auth/guards";
import { checkRateLimit } from "@/lib/rate-limit";
import { getGtmGovernanceReport } from "@/lib/admin/gtm-governance";
import { writeAnalyticsAudit } from "@/lib/analytics/server/audit";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/gtm/governance
 * Centro de Governança GTM — ADMIN only.
 */
export async function GET(request: Request) {
  const { user, error } = await requireAdmin({ path: "/api/admin/gtm/governance" });
  if (error) return error;

  if (!checkRateLimit(`gtm-gov:${user!.id}`, 30, 60_000)) {
    return apiFailure("RATE_LIMIT", "Limite de requisições.", 429);
  }

  try {
    const url = new URL(request.url);
    const persist = url.searchParams.get("persist") === "1";
    const fresh = url.searchParams.get("fresh") === "1";
    const report = await getGtmGovernanceReport({
      persist,
      skipCache: fresh || persist,
    });
    await writeAnalyticsAudit({
      userId: user!.id,
      action: "VIEW",
      resource: "gtm-governance",
    });
    return apiSuccess(report);
  } catch (e) {
    return apiFailure(
      "INTERNAL",
      e instanceof Error ? e.message : "Falha no governance GTM.",
      500
    );
  }
}
