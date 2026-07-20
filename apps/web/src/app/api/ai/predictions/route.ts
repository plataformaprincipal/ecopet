import { apiSuccess, apiFailure } from "@/lib/api-response";
import { requireAuth } from "@/lib/auth/guards";
import { enforceOperationalAiLimits } from "@/lib/ai/ai-rate-limit";
import { runPredictionsForUser, isAiFlagEnabled } from "@/lib/ai/operational";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const { user, error } = await requireAuth();
  if (error || !user) return error!;

  if (!isAiFlagEnabled("predictions")) {
    return apiFailure("AI_FLAG_DISABLED", "Previsões IA desativadas.", 503);
  }

  try {
    enforceOperationalAiLimits(user.id);
    const predictions = await runPredictionsForUser({
      userId: user.id,
      role: user.role,
    });
    return apiSuccess({
      predictions,
      disclaimer:
        "Previsões heurísticas com confiança e limitações explícitas. Não são certezas.",
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Previsões indisponíveis";
    return apiFailure("AI_PREDICTION_ERROR", msg, 503);
  }
}
