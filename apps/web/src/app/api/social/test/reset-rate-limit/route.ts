import { apiFailure, apiSuccess } from "@/lib/api-response";
import { resetSocialRateLimits } from "@/lib/social/rate-limit";

/**
 * Test-only — clears in-memory social rate-limit buckets.
 * Reuses AUTH_TEST_RESET_RATE_LIMIT=1 (same gate as auth reset).
 */
export async function POST() {
  if (process.env.AUTH_TEST_RESET_RATE_LIMIT !== "1") {
    return apiFailure("FORBIDDEN", "Reset de rate limit social indisponível.", 403);
  }
  resetSocialRateLimits();
  return apiSuccess({ socialCleared: true });
}
