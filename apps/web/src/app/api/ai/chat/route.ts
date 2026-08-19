import { z } from "zod";
import { apiSuccess, apiFailure } from "@/lib/api-response";
import { requireAuth } from "@/lib/auth/guards";
import { runEcoPetAI } from "@/lib/ai/ai-orchestrator";
import { normalizeLocale } from "@/lib/ai/ai-config";
import { getDailyUsage } from "@/lib/ai/ai-usage";
import { aiFailureResponse } from "@/lib/ai/ai-route-helper";
import { isAiNotConfiguredCode } from "@/lib/ai/ai-errors";
import {
  AI_NOT_CONFIGURED_USER_MESSAGE,
  INTEGRATION_ERROR_CODES,
} from "@/lib/integrations/integration-errors";
import { resolveServerCapability } from "@/lib/ai/capabilities/orchestrate";
import { AI_CONFIG } from "@/lib/ai/ai-config";

const chatSchema = z.object({
  message: z.string().min(1).max(8000),
  agentId: z.string().optional(),
  type: z.string().optional(),
  petId: z.string().optional(),
  partnerId: z.string().optional(),
  ngoId: z.string().optional(),
  productId: z.string().optional(),
  serviceId: z.string().optional(),
  orderId: z.string().optional(),
  appointmentId: z.string().optional(),
  conversationId: z.string().optional(),
  locale: z.string().optional(),
  integrationPoint: z.string().optional(),
  module: z.string().optional(),
  capabilityId: z.string().max(64).optional(),
});

export async function POST(request: Request) {
  const { user, error } = await requireAuth();
  if (error || !user) return error!;

  const body = await request.json().catch(() => ({}));
  const parsed = chatSchema.safeParse(body);
  if (!parsed.success) {
    return apiFailure("VALIDATION", parsed.error.errors[0]?.message ?? "Dados inválidos", 400);
  }

  const capabilityDecision = resolveServerCapability({
    capabilityId: parsed.data.capabilityId,
    role: user.role,
    hasPet: Boolean(parsed.data.petId),
    hasGeo: false,
    aiConfigured: AI_CONFIG.isConfigured,
    isGuest: false,
    locale: parsed.data.locale,
  });
  if (capabilityDecision.status === "denied") {
    return apiFailure(capabilityDecision.code, capabilityDecision.message, 403);
  }

  const aiModule: "ecopet-ai" | "pets" =
    parsed.data.module === "pets" || parsed.data.type === "pet" ? "pets" : "ecopet-ai";

  const result = await runEcoPetAI({
    userId: user.id,
    role: user.role,
    module: aiModule,
    action: "chat",
    input: parsed.data.message,
    locale: normalizeLocale(parsed.data.locale),
    conversationId: parsed.data.conversationId,
    agentId: parsed.data.agentId as never,
    integrationPoint: parsed.data.integrationPoint as never,
    entityIds: {
      petId: parsed.data.petId,
      partnerId: parsed.data.partnerId,
      ongId: parsed.data.ngoId,
      productId: parsed.data.productId,
      serviceId: parsed.data.serviceId,
      orderId: parsed.data.orderId,
      appointmentId: parsed.data.appointmentId,
    },
  });

  if (!result.success) {
    const code = result.error?.code ?? "AI_ERROR";
    const message = result.error?.message ?? AI_NOT_CONFIGURED_USER_MESSAGE;
    if (isAiNotConfiguredCode(code)) {
      return Response.json(
        {
          success: false as const,
          error: { code: INTEGRATION_ERROR_CODES.AI_NOT_CONFIGURED, message },
          reply: null,
        },
        { status: 503 }
      );
    }
    const failure = aiFailureResponse(result);
    // Compat legado: alguns clientes leem `reply` no topo
    const payload = (await failure.json()) as Record<string, unknown>;
    return Response.json({ ...payload, reply: null }, { status: failure.status });
  }

  const usage = await getDailyUsage(user.id).catch(() => null);

  return apiSuccess({
    ...result,
    content: result.content,
    reply: result.content,
    dailyUsage: usage,
  });
}
