import { z } from "zod";
import { apiSuccess, apiFailure } from "@/lib/api-response";
import { requireAuth } from "@/lib/auth/guards";
import { runOrchestrator } from "@/lib/ai/orchestrator";
import type { AiAgentId, AiIntegrationPointId } from "@/lib/ai/types";

const chatSchema = z.object({
  message: z.string().min(1).max(8000),
  agentId: z.string().optional(),
  petId: z.string().optional(),
  partnerId: z.string().optional(),
  ngoId: z.string().optional(),
  integrationPoint: z.string().optional(),
});

export async function POST(request: Request) {
  const { user, error } = await requireAuth();
  if (error || !user) return error!;

  const body = await request.json().catch(() => ({}));
  const parsed = chatSchema.safeParse(body);
  if (!parsed.success) {
    return apiFailure("VALIDATION", parsed.error.errors[0]?.message ?? "Dados inválidos", 400);
  }

  const result = await runOrchestrator({
    userId: user.id,
    role: user.role,
    message: parsed.data.message,
    agentId: parsed.data.agentId as AiAgentId | undefined,
    petId: parsed.data.petId,
    partnerId: parsed.data.partnerId,
    ngoId: parsed.data.ngoId,
    integrationPoint: parsed.data.integrationPoint as AiIntegrationPointId | undefined,
  });

  if (!result.success) {
    const code = result.error?.code ?? "AI_ERROR";
    const status =
      code === "AGENT_FORBIDDEN" ? 403
      : code === "MODERATION_BLOCKED" ? 422
      : 503;
    return apiFailure(code, result.error?.message ?? "Erro na IA.", status);
  }

  return apiSuccess(result);
}
