import { z } from "zod";
import { apiFailure, apiSuccess } from "@/lib/api-response";
import { requireApprovedPartner } from "@/lib/auth/require-auth";
import { runOrchestrator } from "@/lib/ai/orchestrator";
import { isAIProviderConfigured } from "@/lib/ai/provider";
import type { AiAgentId } from "@/lib/ai/types";
import { auditPartnerErp } from "@/lib/partner/erp/store";
import { ALL_PARTNER_AI_ASSISTANTS } from "@/lib/partner/erp/ops-service";
import { getPartnerFinanceiroModule } from "@/lib/partner/erp/partner-erp-service";
import { getPartnerMarketingModule } from "@/lib/partner/erp/growth-service";
import { prisma } from "@/lib/prisma";

const chatSchema = z.object({
  message: z.string().min(1).max(8000),
  assistantId: z.string().optional(),
  agentId: z.string().optional(),
});

const ASSISTANT_AGENT: Record<string, AiAgentId> = {
  finance: "finance",
  commercial: "commercial",
  veterinary: "partner",
  admin: "partner",
  inventory: "partner",
  marketing: "marketing",
  campaigns: "marketing",
  posts: "marketing",
  customer_reply: "commercial",
  recommendations: "marketplace",
};

const ASSISTANT_CONTEXT: Record<string, string> = {
  finance: "Contexto: assistente financeiro do parceiro EcoPet.",
  commercial: "Contexto: assistente comercial do parceiro — metas, CRM e vendas.",
  veterinary: "Contexto: assistente veterinário/clínica — saúde animal e agenda de serviços.",
  admin: "Contexto: assistente administrativo — processos internos do parceiro.",
  inventory: "Contexto: assistente de estoque — produtos, reposição e inventário.",
  marketing: "Contexto: assistente de marketing — campanhas e visibilidade.",
  campaigns: "Contexto: criar campanhas de marketing multicanal (e-mail, push, SMS, anúncios) com ROI estimado.",
  posts: "Contexto: criar posts para rede social — legendas, hashtags e tom de voz da marca.",
  customer_reply: "Contexto: responder clientes com empatia — dúvidas, reclamações e pós-venda.",
  recommendations: "Contexto: recomendar produtos e serviços do catálogo do parceiro.",
};

/** Chat IA do parceiro — via AI Orchestrator. */
export async function POST(request: Request) {
  const { user, error } = await requireApprovedPartner();
  if (error || !user) return error!;

  if (!isAIProviderConfigured()) {
    return apiFailure("AI_PROVIDER_NOT_CONFIGURED", "IA ainda não configurada.", 503);
  }

  const body = await request.json().catch(() => ({}));
  const parsed = chatSchema.safeParse(body);
  if (!parsed.success) {
    return apiFailure("VALIDATION", parsed.error.errors[0]?.message ?? "Dados inválidos", 400);
  }

  const assistantId = parsed.data.assistantId ?? "admin";
  const agentId = (parsed.data.agentId ?? ASSISTANT_AGENT[assistantId] ?? "partner") as AiAgentId;
  const assistant = ALL_PARTNER_AI_ASSISTANTS.find((a) => a.id === assistantId);
  const contextPrefix = ASSISTANT_CONTEXT[assistantId] ?? ASSISTANT_CONTEXT.admin;

  let enriched = `${contextPrefix}\n\nPergunta: ${parsed.data.message}`;
  if (assistantId === "finance") {
    const panel = await getPartnerFinanceiroModule(prisma, user.id);
    const revenue = panel.kpis?.find((k) => k.key === "receivable")?.value;
    enriched = `${contextPrefix}\nReceita/indicadores: ${revenue ?? "sem dados"}\n\nPergunta: ${parsed.data.message}`;
  }
  if (assistantId === "inventory" || assistantId === "recommendations") {
    const products = await prisma.product.findMany({
      where: { sellerId: user.id, deletedAt: null },
      select: { name: true, price: true, catalogCategory: true },
      take: 15,
    });
    enriched = `${contextPrefix}\nCatálogo (amostra): ${JSON.stringify(products)}\n\nPergunta: ${parsed.data.message}`;
  }
  if (assistantId === "campaigns") {
    const panel = await getPartnerMarketingModule(prisma, user.id);
    const campaigns = panel.kpis?.find((k) => k.key === "campaigns")?.value ?? 0;
    enriched = `${contextPrefix}\nCampanhas ativas: ${campaigns}\n\nPergunta: ${parsed.data.message}`;
  }
  if (assistantId === "posts") {
    const postCount = await prisma.socialPost.count({ where: { authorId: user.id, deletedAt: null } });
    enriched = `${contextPrefix}\nPosts publicados: ${postCount}\n\nPergunta: ${parsed.data.message}`;
  }

  const integrationPoint =
    assistantId === "commercial" || assistantId === "customer_reply"
      ? "partner"
      : assistantId === "recommendations"
        ? "marketplace"
        : assistantId === "posts"
          ? "social"
          : undefined;

  const result = await runOrchestrator({
    userId: user.id,
    role: user.role,
    message: enriched,
    agentId,
    integrationPoint,
  });

  await auditPartnerErp({
    actorId: user.id,
    partnerId: user.id,
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
