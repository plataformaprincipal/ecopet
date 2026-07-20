import { apiSuccess, apiFailure } from "@/lib/api-response";
import { requireAdmin } from "@/lib/auth/guards";
import { checkRateLimit } from "@/lib/rate-limit";
import {
  getAiFoundationStatus,
  runAiFoundationHealth,
  runAiFoundationDiagnostics,
  runAiFoundationSmokeTest,
} from "@/lib/ai/foundation";

export const dynamic = "force-dynamic";

async function guard(request: Request) {
  const { user, error } = await requireAdmin({
    path: new URL(request.url).pathname,
  });
  if (error) return { user: null, error };
  if (!checkRateLimit(`ai-foundation:${user!.id}`, 30, 60_000)) {
    return {
      user: null,
      error: apiFailure("RATE_LIMIT", "Limite de requisições da fundação IA.", 429),
    };
  }
  return { user, error: null };
}

export async function GET(request: Request) {
  const { error } = await guard(request);
  if (error) return error;

  const url = new URL(request.url);
  const view = url.searchParams.get("view") ?? "status";

  if (view === "health") {
    return apiSuccess(await runAiFoundationHealth());
  }
  if (view === "diagnostics") {
    return apiSuccess(runAiFoundationDiagnostics());
  }
  return apiSuccess(getAiFoundationStatus());
}

/** POST — smoke test mínimo (max_tokens=8). */
export async function POST(request: Request) {
  const { user, error } = await guard(request);
  if (error) return error;

  if (!checkRateLimit(`ai-foundation-test:${user!.id}`, 5, 60_000)) {
    return apiFailure("RATE_LIMIT", "Limite de testes IA.", 429);
  }

  const result = await runAiFoundationSmokeTest();
  if (!result.ok && result.errorCode === "AI_NOT_CONFIGURED") {
    return apiFailure("AI_NOT_CONFIGURED", "OpenAI não configurada neste ambiente.", 503);
  }
  return apiSuccess(result);
}
