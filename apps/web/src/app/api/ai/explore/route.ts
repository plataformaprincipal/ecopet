import { z } from "zod";
import { apiSuccess, apiFailure } from "@/lib/api-response";
import { requireAuth } from "@/lib/auth/guards";
import { enforceOperationalAiLimits } from "@/lib/ai/ai-rate-limit";
import { writeAiAuditLog } from "@/lib/ai/ai-audit";
import { runExploreByMessage, isAiFlagEnabled } from "@/lib/ai/operational";

export const dynamic = "force-dynamic";

const schema = z.object({
  message: z.string().min(2).max(500),
});

export async function POST(request: Request) {
  const { user, error } = await requireAuth();
  if (error || !user) return error!;

  if (!isAiFlagEnabled("explore_ai")) {
    return apiFailure("AI_FLAG_DISABLED", "Explorar IA desativado.", 503);
  }

  const body = await request.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return apiFailure("VALIDATION", parsed.error.errors[0]?.message ?? "Dados inválidos", 400);
  }

  try {
    enforceOperationalAiLimits(user.id);
    const result = await runExploreByMessage(parsed.data.message);
    await writeAiAuditLog({
      userId: user.id,
      role: user.role,
      module: "search",
      action: "explore-nl",
      decision: "ALLOW",
      metadata: { target: result.plan.target, cards: result.count },
    });
    return apiSuccess(result);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Explorar indisponível";
    return apiFailure("AI_EXPLORE_ERROR", msg, 503);
  }
}
