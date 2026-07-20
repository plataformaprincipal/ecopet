import { z } from "zod";
import { apiSuccess, apiFailure } from "@/lib/api-response";
import { requireAuth } from "@/lib/auth/guards";
import { enforceOperationalAiLimits } from "@/lib/ai/ai-rate-limit";
import { executeAiActionTool } from "@/lib/ai/operational/action-tools";
import { isAiFlagEnabled } from "@/lib/ai/operational";

export const dynamic = "force-dynamic";

const schema = z.object({
  tool: z.string().min(1).max(80),
  params: z.record(z.unknown()).default({}),
  confirmed: z.boolean().optional(),
  confirmationToken: z.string().optional(),
  pagePath: z.string().max(200).optional(),
});

export async function POST(request: Request) {
  const { user, error } = await requireAuth();
  if (error || !user) return error!;

  if (!isAiFlagEnabled("tools")) {
    return apiFailure("AI_FLAG_DISABLED", "Ferramentas IA desativadas.", 503);
  }

  const body = await request.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return apiFailure("VALIDATION", parsed.error.errors[0]?.message ?? "Dados inválidos", 400);
  }

  try {
    enforceOperationalAiLimits(user.id);
    const result = await executeAiActionTool({
      userId: user.id,
      role: user.role,
      tool: parsed.data.tool,
      params: parsed.data.params,
      confirmed: parsed.data.confirmed,
      confirmationToken: parsed.data.confirmationToken,
      pagePath: parsed.data.pagePath,
    });
    return apiSuccess(result);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Ação indisponível";
    return apiFailure("AI_ACTION_ERROR", msg, 503);
  }
}
