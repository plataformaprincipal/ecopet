import { z } from "zod";
import { apiFailure, apiSuccess } from "@/lib/api-response";
import { requireAdmin } from "@/lib/auth/guards";
import { runOrchestrator } from "@/lib/ai/orchestrator";
import { isAIProviderConfigured } from "@/lib/ai/provider";
import { createIncident } from "@/lib/admin/governance/support-governance-service";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  mode: z.enum(["classify_report", "summarize_ticket", "suggest_reply", "detect_abuse", "prioritize_incident", "case_report"]),
  ticketId: z.string().optional(),
  reportText: z.string().max(8000).optional(),
  incidentType: z.string().optional(),
  message: z.string().max(8000).optional(),
});

const PROMPTS: Record<string, string> = {
  classify_report: "Classifique a denúncia em: spam, golpe, assédio, conteúdo proibido, outro. Indique prioridade (baixa/média/alta/crítica) e ação sugerida. Não aplique punição automática.",
  summarize_ticket: "Resuma o ticket de suporte de forma objetiva para o admin, com pontos de ação.",
  suggest_reply: "Sugira uma resposta profissional e empática ao solicitante do ticket.",
  detect_abuse: "Analise se há linguagem abusiva, spam ou golpe. Responda em JSON: { abuse: boolean, spam: boolean, scam: boolean, notes: string }.",
  prioritize_incident: "Priorize o incidente com severidade e próximos passos.",
  case_report: "Gere relatório de caso para moderação/compliance com timeline sugerida.",
};

export async function POST(request: Request) {
  const { user, error } = await requireAdmin({ path: "/api/admin/governance/ai" });
  if (error) return error;

  if (!isAIProviderConfigured()) {
    return apiFailure(
      "AI_NOT_CONFIGURED",
      "IA não configurada. Defina as variáveis do provider (ex.: OPENAI_API_KEY ou GEMINI_API_KEY).",
      503
    );
  }

  const body = await request.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return apiFailure("VALIDATION", parsed.error.errors[0]?.message ?? "Dados inválidos", 400);
  }

  let context = parsed.data.message ?? "";
  if (parsed.data.ticketId) {
    const ticket = await prisma.supportTicket.findUnique({
      where: { id: parsed.data.ticketId },
      select: { subject: true, description: true, category: true, priority: true, status: true },
    });
    if (ticket) {
      context = `Ticket: ${ticket.subject}\nCategoria: ${ticket.category}\nPrioridade: ${ticket.priority}\nStatus: ${ticket.status}\nDescrição: ${ticket.description}`;
    }
  }
  if (parsed.data.reportText) context = parsed.data.reportText;

  const system = `Você é assistente de moderação e suporte EcoPet (admin interno). ${PROMPTS[parsed.data.mode]}`;

  try {
    const result = await runOrchestrator({
      agentId: "admin",
      userId: user!.id,
      role: user!.role,
      message: `${system}\n\nConteúdo:\n${context || "Sem conteúdo adicional."}`,
      metadata: { governanceMode: parsed.data.mode },
    });

    const text = result.content ?? "";

    if (parsed.data.mode === "prioritize_incident" && parsed.data.incidentType) {
      await createIncident({
        adminId: user!.id,
        type: parsed.data.incidentType,
        severity: "high",
        reason: `Priorização IA: ${text.slice(0, 500)}`,
      });
    }

    return apiSuccess({ text, mode: parsed.data.mode });
  } catch (e) {
    console.error("[governance:ai]", e);
    return apiFailure("AI_ERROR", "Falha ao processar com IA.", 502);
  }
}
