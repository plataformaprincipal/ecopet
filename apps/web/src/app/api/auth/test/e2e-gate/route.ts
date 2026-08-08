import { apiFailure, apiSuccess } from "@/lib/api-response";
import { E2E_TEST_HEADER, isAuthorizedE2ePreviewRequest } from "@/lib/e2e-preview-auth";
import { clientIp, clientIpForRateLimit } from "@/lib/rate-limit";

/**
 * Diagnóstico Preview-only do gate E2E (rate-limit).
 * Production → 404. Sem exposição do secret.
 */
export async function GET(request: Request) {
  if (process.env.VERCEL_ENV === "production") {
    return apiFailure("NOT_FOUND", "Not found", 404);
  }
  if (process.env.VERCEL_ENV !== "preview") {
    return apiFailure("NOT_FOUND", "Not found", 404);
  }

  const header = request.headers.get(E2E_TEST_HEADER);
  return apiSuccess({
    vercelEnv: process.env.VERCEL_ENV ?? null,
    e2eMode: process.env.E2E_TEST_MODE ?? null,
    secretConfigured: Boolean(process.env.E2E_TEST_SECRET?.trim()),
    secretLen: process.env.E2E_TEST_SECRET?.trim()?.length ?? 0,
    headerPresent: Boolean(header?.trim()),
    headerLen: header?.trim()?.length ?? 0,
    authorized: isAuthorizedE2ePreviewRequest(request),
    edgeIp: clientIp(request),
    rateLimitIp: clientIpForRateLimit(request),
  });
}
