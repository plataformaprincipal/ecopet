import { z } from "zod";
import { apiSuccess, apiFailure } from "@/lib/api-response";
import { requireClient } from "@/lib/auth/require-auth";
import { runOrchestrator } from "@/lib/ai/orchestrator";
import type { AiAgentId, AiIntegrationPointId } from "@/lib/ai/types";
import { assertPetOwnership } from "@/lib/client/pet-ownership";

const chatSchema = z.object({
  message: z.string().min(1).max(8000),
  agentId: z.string().optional(),
  petId: z.string().optional(),
  integrationPoint: z.string().optional(),
});

/** Chat do cliente — sempre via AI Orchestrator. */
export async function POST(request: Request) {
  const { user, error } = await requireClient();
  if (error || !user) return error!;

  const body = await request.json().catch(() => ({}));
  const parsed = chatSchema.safeParse(body);
  if (!parsed.success) {
    return apiFailure("VALIDATION", parsed.error.errors[0]?.message ?? "Dados inválidos", 400);
  }

  if (parsed.data.petId) {
    const owned = await assertPetOwnership(parsed.data.petId, user.id);
    if (!owned) return apiFailure("FORBIDDEN", "Pet não pertence a este usuário.", 403);
  }

  const result = await runOrchestrator({
    userId: user.id,
    role: user.role,
    message: parsed.data.message,
    agentId: parsed.data.agentId as AiAgentId | undefined,
    petId: parsed.data.petId,
    integrationPoint: parsed.data.integrationPoint as AiIntegrationPointId | undefined,
  });

  if (!result.success) {
    const code = result.error?.code ?? "AI_ERROR";
    const message =
      code === "AI_PROVIDER_NOT_CONFIGURED" ? "IA ainda não configurada." : (result.error?.message ?? "Erro na IA.");
    const status =
      code === "AGENT_FORBIDDEN" ? 403
      : code === "MODERATION_BLOCKED" ? 422
      : 503;
    return apiFailure(code, message, status);
  }

  return apiSuccess(result);
}
