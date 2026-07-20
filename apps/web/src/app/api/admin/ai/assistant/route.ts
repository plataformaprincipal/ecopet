import { apiSuccess } from "@/lib/api-response";
import { requireAdmin } from "@/lib/auth/guards";
import { getAssistantAnalyticsSummary } from "@/lib/ai/assistant";
import { runAiFoundationHealth } from "@/lib/ai/foundation";
import { getBusinessAiDiagnostics } from "@/lib/ai/modules";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { error } = await requireAdmin({
    path: new URL(request.url).pathname,
  });
  if (error) return error;

  const [analytics, health, business] = await Promise.all([
    getAssistantAnalyticsSummary(),
    runAiFoundationHealth(),
    getBusinessAiDiagnostics(),
  ]);

  return apiSuccess({ analytics, health, business });
}
