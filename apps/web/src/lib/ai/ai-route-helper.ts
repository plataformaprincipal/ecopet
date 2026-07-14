import { z } from "zod";
import { apiSuccess, apiFailure } from "@/lib/api-response";
import { requireAuth } from "@/lib/auth/guards";
import { runEcoPetAI, type RunEcoPetAIResult } from "@/lib/ai/ai-orchestrator";
import type { AiModule } from "@/lib/ai/ai-config";
import { normalizeLocale } from "@/lib/ai/ai-config";
import { isAiNotConfiguredCode } from "@/lib/ai/ai-errors";
import {
  aiNotConfiguredResponse,
  AI_NOT_CONFIGURED_USER_MESSAGE,
} from "@/lib/integrations/integration-errors";

export const aiActionBodySchema = z.object({
  input: z.string().min(1).max(8000).optional(),
  message: z.string().min(1).max(8000).optional(),
  locale: z.string().optional(),
  conversationId: z.string().optional(),
  confirmed: z.boolean().optional(),
  entityIds: z
    .object({
      petId: z.string().optional(),
      productId: z.string().optional(),
      serviceId: z.string().optional(),
      orderId: z.string().optional(),
      appointmentId: z.string().optional(),
      partnerId: z.string().optional(),
      ongId: z.string().optional(),
    })
    .optional(),
  productIds: z.array(z.string()).optional(),
  context: z.string().max(4000).optional(),
});

/** Mapeia falha de runEcoPetAI para resposta HTTP — nunca finge sucesso. */
export function aiFailureResponse(result: RunEcoPetAIResult) {
  const code = result.error?.code ?? "AI_ERROR";
  const message = result.error?.message ?? "Erro na IA.";

  if (isAiNotConfiguredCode(code)) {
    return aiNotConfiguredResponse(message || AI_NOT_CONFIGURED_USER_MESSAGE);
  }

  const status =
    code.includes("RATE") || code.includes("BUDGET")
      ? 429
      : code.includes("CONFIRM")
        ? 409
        : code.includes("BLOCK") || code.includes("CONTENT")
          ? 422
          : code.includes("PERSONA") || code.includes("FORBIDDEN")
            ? 403
            : code.includes("SESSION")
              ? 401
              : 503;

  return apiFailure(code, message, status);
}

export async function handleModuleAiAction(opts: {
  request: Request;
  module: AiModule;
  action: string;
  requireClient?: boolean;
}) {
  const { user, error } = await requireAuth();
  if (error || !user) return error!;

  const body = await opts.request.json().catch(() => ({}));
  const parsed = aiActionBodySchema.safeParse(body);
  if (!parsed.success) {
    return apiFailure("VALIDATION", parsed.error.errors[0]?.message ?? "Dados inválidos", 400);
  }

  const input =
    parsed.data.input ??
    parsed.data.message ??
    parsed.data.context ??
    "";

  if (!input.trim()) {
    return apiFailure("VALIDATION", "Entrada obrigatória.", 400);
  }

  const result = await runEcoPetAI({
    userId: user.id,
    role: user.role,
    module: opts.module,
    action: opts.action,
    input: parsed.data.productIds?.length
      ? `${input}\n\nIDs: ${parsed.data.productIds.join(",")}`
      : input,
    locale: normalizeLocale(parsed.data.locale),
    entityIds: parsed.data.entityIds,
    conversationId: parsed.data.conversationId,
    confirmed: parsed.data.confirmed,
  });

  if (!result.success) {
    return aiFailureResponse(result);
  }

  return apiSuccess({
    ...result,
    reply: result.content,
  });
}
