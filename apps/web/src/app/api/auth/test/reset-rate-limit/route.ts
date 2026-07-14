import { apiFailure, apiSuccess } from "@/lib/api-response";
import { resetRateLimitStore } from "@/lib/rate-limit";
import { resetSocialRateLimits } from "@/lib/social/rate-limit";

/**
 * Endpoint exclusivo de teste — limpa buckets in-memory de rate limit (auth + social).
 * Requer AUTH_TEST_RESET_RATE_LIMIT=1 (nunca habilitar em produção pública).
 */
export async function POST(request: Request) {
  if (process.env.AUTH_TEST_RESET_RATE_LIMIT !== "1") {
    return apiFailure("FORBIDDEN", "Reset de rate limit indisponível.", 403);
  }

  let prefix: string | undefined;
  try {
    const body = await request.json().catch(() => null);
    if (body && typeof body.prefix === "string" && body.prefix.trim()) {
      prefix = body.prefix.trim();
    }
  } catch {
    /* body opcional */
  }

  const cleared = resetRateLimitStore(prefix);
  resetSocialRateLimits();
  return apiSuccess({ cleared, socialCleared: true, prefix: prefix ?? null });
}
