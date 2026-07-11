import { z } from "zod";
import { apiSuccess, apiFailure } from "@/lib/api-response";
import { requireAuth } from "@/lib/auth/guards";
import { runEcoPetAI } from "@/lib/ai/ai-orchestrator";
import { normalizeLocale } from "@/lib/ai/ai-config";
import { getDailyUsage } from "@/lib/ai/ai-usage";

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
});

export async function POST(request: Request) {
  const { user, error } = await requireAuth();
  if (error || !user) return error!;

  const body = await request.json().catch(() => ({}));
  const parsed = chatSchema.safeParse(body);
  if (!parsed.success) {
    return apiFailure("VALIDATION", parsed.error.errors[0]?.message ?? "Dados inválidos", 400);
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
    const status =
      code.includes("RATE") || code.includes("BUDGET") ? 429
      : code.includes("BLOCK") || code.includes("CONTENT") ? 422
      : code.includes("PERSONA") || code.includes("FORBIDDEN") ? 403
      : 503;
    // Compat legado: alguns clientes leem `reply` no topo
    return Response.json(
      {
        success: false,
        error: { code, message: result.error?.message ?? "Erro na IA." },
        reply: null,
      },
      { status }
    );
  }

  const usage = await getDailyUsage(user.id).catch(() => null);

  return apiSuccess({
    ...result,
    content: result.content,
    reply: result.content,
    dailyUsage: usage,
  });
}
