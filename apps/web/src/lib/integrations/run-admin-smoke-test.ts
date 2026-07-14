import { NextResponse } from "next/server";
import { apiSuccess } from "@/lib/api-response";
import { requireAdmin } from "@/lib/auth/guards";
import type { SmokeTestResult } from "@/lib/integrations/integration-smoke-tests";

/**
 * Smoke tests always return HTTP 200 with `{ ok, code, ... }` in `data`
 * (including NOT_CONFIGURED). Auth failures still use 401/403.
 */
export async function runAdminSmokeTest(
  path: string,
  run: (actorId: string) => Promise<SmokeTestResult | { results: SmokeTestResult[] }>
): Promise<NextResponse> {
  const { user, error } = await requireAdmin({ path });
  if (error) return error;

  try {
    const data = await run(user!.id);
    return apiSuccess(data);
  } catch {
    return apiSuccess({
      ok: false,
      code: "SMOKE_FAILED",
      provider: "unknown",
      message: "Falha interna no smoke test.",
      checkedAt: new Date().toISOString(),
    } satisfies SmokeTestResult);
  }
}
