import { apiSuccess, apiFailure } from "@/lib/api-response";
import { requireAdmin } from "@/lib/auth/guards";
import { checkRateLimit } from "@/lib/rate-limit";
import { appendGtmDataLayerSample, gtmGovCacheClear } from "@/lib/admin/gtm-governance";
import { isSafeEventName, sanitizeEventParams } from "@/lib/analytics/sanitize";

export const dynamic = "force-dynamic";

/**
 * POST — amostra sanitizada do dataLayer (debug ADMIN).
 * Não é warehouse; ring buffer ≤50 no AnalyticsOpsState.
 */
export async function POST(request: Request) {
  const { user, error } = await requireAdmin({ path: "/api/admin/gtm/datalayer-sample" });
  if (error) return error;

  if (!checkRateLimit(`gtm-sample:${user!.id}`, 40, 60_000)) {
    return apiFailure("RATE_LIMIT", "Limite de amostras.", 429);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiFailure("VALIDATION", "JSON inválido.", 400);
  }

  const raw = body as { event?: unknown; module?: unknown };
  const event = typeof raw.event === "string" ? raw.event.slice(0, 64) : "";
  if (!event || (!isSafeEventName(event) && !event.startsWith("ecopet_"))) {
    return apiFailure("VALIDATION", "Evento inválido.", 400);
  }

  const cleaned = sanitizeEventParams({
    module: typeof raw.module === "string" ? raw.module.slice(0, 40) : undefined,
  });

  await appendGtmDataLayerSample({
    event,
    at: new Date().toISOString(),
    module: typeof cleaned.module === "string" ? cleaned.module : undefined,
  });
  gtmGovCacheClear();

  return apiSuccess({ ok: true });
}
