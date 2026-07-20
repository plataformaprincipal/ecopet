import { apiSuccess, apiFailure } from "@/lib/api-response";
import { requireAuth } from "@/lib/auth/guards";
import { enforceOperationalAiLimits } from "@/lib/ai/ai-rate-limit";
import { writeAiAuditLog } from "@/lib/ai/ai-audit";
import { buildMyPetAiSummary, isAiFlagEnabled } from "@/lib/ai/operational";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { user, error } = await requireAuth();
  if (error || !user) return error!;

  if (!isAiFlagEnabled("mypet_ai")) {
    return apiFailure("AI_FLAG_DISABLED", "Meu Pet IA desativado.", 503);
  }

  if (user.role !== "CLIENT" && user.role !== "TUTOR" && user.role !== "ADMIN") {
    return apiFailure("FORBIDDEN", "Resumo Meu Pet disponível para clientes.", 403);
  }

  try {
    enforceOperationalAiLimits(user.id);
    const summary = await buildMyPetAiSummary(user.id);
    await writeAiAuditLog({
      userId: user.id,
      role: user.role,
      module: "pets",
      action: "mypet-summary",
      decision: "ALLOW",
      metadata: { petsCount: summary.petsCount },
    });
    // Não retorna promptSafeBlock ao cliente em massa — apenas highlights seguros
    const { promptSafeBlock: _p, ...safe } = summary;
    return apiSuccess(safe);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Resumo indisponível";
    return apiFailure("AI_MYPET_ERROR", msg, 503);
  }
}
