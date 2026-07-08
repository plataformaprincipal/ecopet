import { z } from "zod";
import { apiFailure, apiSuccess } from "@/lib/api-response";
import { requireOngWithAccess } from "@/lib/ong/require-ong-access";
import { runOrchestrator } from "@/lib/ai/orchestrator";
import { isAIProviderConfigured } from "@/lib/ai/provider";
import type { AiAgentId } from "@/lib/ai/types";
import { auditNgoErp } from "@/lib/ong/erp/store";
import { ALL_NGO_AI_ASSISTANTS } from "@/lib/ong/erp/ngo-platform-service";
import { getNgoFinanceiroModule } from "@/lib/ong/erp/ngo-operations-service";
import { getNgoMarketingModule } from "@/lib/ong/erp/ngo-platform-service";
import { prisma } from "@/lib/prisma";

const chatSchema = z.object({
  message: z.string().min(1).max(8000),
  assistantId: z.string().optional(),
  agentId: z.string().optional(),
});

const ASSISTANT_AGENT: Record<string, AiAgentId> = {
  adoption: "ngo",
  campaign: "ngo",
  finance: "finance",
  volunteer: "ngo",
  marketing: "marketing",
  admin: "ngo",
  welfare: "veterinarian",
};

const ASSISTANT_CONTEXT: Record<string, string> = {
  adoption:
    "Contexto: assistente de adoção ONG. Priorize animais com menor chance de adoção e classifique candidatos com critérios objetivos. NÃO exponha e-mail, telefone, CPF ou documentos de adotantes.",
  campaign: "Contexto: assistente de campanhas ONG. Sugira textos, fotos e estratégias de arrecadação.",
  finance: "Contexto: assistente financeiro ONG. Relatórios agregados e prestação de contas. Não exponha dados bancários completos.",
  volunteer: "Contexto: assistente de voluntariado — escalas, funções e engajamento.",
  marketing: "Contexto: assistente de marketing ONG — posts, calendário editorial e métricas.",
  admin: "Contexto: assistente administrativo ONG — processos e tarefas internas.",
  welfare:
    "Contexto: bem-estar animal. Resuma histórico de forma agregada. Não exponha prontuários clínicos completos nem documentos privados.",
};

/** Chat IA da ONG — via AI Orchestrator. */
export async function POST(request: Request) {
  const { user, error } = await requireOngWithAccess(true);
  if (error || !user) return error!;

  if (!isAIProviderConfigured()) {
    return apiFailure("AI_PROVIDER_NOT_CONFIGURED", "IA ainda não configurada.", 503);
  }

  const body = await request.json().catch(() => ({}));
  const parsed = chatSchema.safeParse(body);
  if (!parsed.success) {
    return apiFailure("VALIDATION", parsed.error.errors[0]?.message ?? "Dados inválidos", 400);
  }

  const assistantId = parsed.data.assistantId ?? "adoption";
  const agentId = (parsed.data.agentId ?? ASSISTANT_AGENT[assistantId] ?? "ngo") as AiAgentId;
  const assistant = ALL_NGO_AI_ASSISTANTS.find((a) => a.id === assistantId);
  const contextPrefix = ASSISTANT_CONTEXT[assistantId] ?? ASSISTANT_CONTEXT.adoption;
  const ongId = user.id;

  let enriched = `${contextPrefix}\n\nPergunta: ${parsed.data.message}`;

  if (assistantId === "finance") {
    const panel = await getNgoFinanceiroModule(prisma, ongId);
    const balance = panel.kpis?.find((k) => k.key === "balance")?.value;
    enriched = `${contextPrefix}\nIndicadores agregados: saldo ${balance ?? "—"}\n\nPergunta: ${parsed.data.message}`;
  }

  if (assistantId === "adoption") {
    const [listings, requests] = await Promise.all([
      prisma.adoptionListing.findMany({
        where: { ongId },
        select: { id: true, name: true, status: true, species: true, createdAt: true },
        orderBy: { createdAt: "asc" },
        take: 15,
      }),
      prisma.adoptionRequest.findMany({
        where: { ongId, status: "PENDING" },
        select: { id: true, status: true, listingId: true, createdAt: true },
        take: 10,
      }),
    ]);
    enriched = `${contextPrefix}\nAnimais (sem PII): ${JSON.stringify(listings)}\nSolicitações pendentes (sem dados pessoais): ${JSON.stringify(requests)}\n\nPergunta: ${parsed.data.message}`;
  }

  if (assistantId === "campaign" || assistantId === "marketing") {
    const panel = await getNgoMarketingModule(prisma, ongId);
    const reach = panel.kpis?.find((k) => k.key === "reach")?.value;
    enriched = `${contextPrefix}\nAlcance estimado: ${reach ?? "—"}\n\nPergunta: ${parsed.data.message}`;
  }

  if (assistantId === "welfare") {
    const animals = await prisma.adoptionListing.findMany({
      where: { ongId },
      select: { id: true, name: true, status: true, requirements: true },
      take: 10,
    });
    enriched = `${contextPrefix}\nAnimais (resumo): ${JSON.stringify(animals.map((a) => ({ id: a.id, nome: a.name, status: a.status })))}\n\nPergunta: ${parsed.data.message}`;
  }

  const result = await runOrchestrator({
    userId: ongId,
    role: user.role,
    message: enriched,
    agentId,
    ngoId: ongId,
    integrationPoint: assistantId === "marketing" ? "social" : "ngo",
  });

  await auditNgoErp({
    actorId: ongId,
    ongId,
    module: "ia",
    resource: "ai_chat",
    action: "CREATE",
    observation: `Assistente: ${assistant?.label ?? assistantId}`,
    entityAfter: { assistantId, agentId, success: result.success },
  });

  if (!result.success) {
    const message =
      result.error?.code === "AI_PROVIDER_NOT_CONFIGURED"
        ? "IA ainda não configurada."
        : (result.error?.message ?? "Erro na IA.");
    return apiFailure(result.error?.code ?? "AI_ERROR", message, 503);
  }

  return apiSuccess({ ...result, assistant: assistant?.label ?? assistantId });
}
