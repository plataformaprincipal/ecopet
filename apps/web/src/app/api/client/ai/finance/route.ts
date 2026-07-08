import { z } from "zod";
import { apiSuccess, apiFailure } from "@/lib/api-response";
import { requireClient } from "@/lib/auth/require-auth";
import { prisma } from "@/lib/prisma";
import { runOrchestrator } from "@/lib/ai/orchestrator";
import { buildClientFinancePanel, buildFinanceAiContext } from "@/lib/client/finance-panel";
import { isAIProviderConfigured } from "@/lib/ai/provider";

const schema = z.object({
  message: z.string().min(1).max(4000),
});

const FINANCE_PROMPTS = [
  "quanto gastei este mês?",
  "onde posso economizar?",
  "qual pet gera mais custo?",
  "quanto gastei com medicamentos?",
  "qual previsão do próximo mês?",
];

/** IA financeira do cliente — via AI Orchestrator + contexto real. */
export async function POST(request: Request) {
  const { user, error } = await requireClient();
  if (error || !user) return error!;

  if (!isAIProviderConfigured()) {
    return apiFailure("AI_PROVIDER_NOT_CONFIGURED", "IA ainda não configurada.", 503);
  }

  const body = await request.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return apiFailure("VALIDATION", parsed.error.errors[0]?.message ?? "Dados inválidos", 400);
  }

  const panel = await buildClientFinancePanel(prisma, user.id);
  const context = buildFinanceAiContext(panel);
  const enrichedMessage = `Contexto financeiro do tutor:\n${context}\n\nPergunta: ${parsed.data.message}`;

  const result = await runOrchestrator({
    userId: user.id,
    role: user.role,
    message: enrichedMessage,
    agentId: "finance",
  });

  if (!result.success) {
    const message =
      result.error?.code === "AI_PROVIDER_NOT_CONFIGURED"
        ? "IA ainda não configurada."
        : (result.error?.message ?? "Erro na IA.");
    return apiFailure(result.error?.code ?? "AI_ERROR", message, 503);
  }

  return apiSuccess({ ...result, suggestedPrompts: FINANCE_PROMPTS, context: panel });
}

export async function GET() {
  const { error } = await requireClient();
  if (error) return error;
  return apiSuccess({ suggestedPrompts: FINANCE_PROMPTS });
}
