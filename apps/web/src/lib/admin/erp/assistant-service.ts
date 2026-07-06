import { prisma } from "@/lib/prisma";
import { getErpBiModule } from "@/lib/admin/erp/bi-service";
import { getAdminFinanceModule } from "@/lib/admin/dashboard-service";
import { getAdminIntegrationsModule } from "@/lib/admin/dashboard-service";
import type { ErpAssistantResponse } from "@/lib/admin/erp/types";
import { isOpenAiConfigured } from "@/lib/integrations/env-check";

/** Copiloto executivo — respostas baseadas em dados reais (sem mock). */
export async function answerExecutiveQuestion(question: string): Promise<ErpAssistantResponse> {
  const q = question.toLowerCase().trim();
  const sources: string[] = [];

  if (q.includes("receita") && (q.includes("mês") || q.includes("mes"))) {
    const bi = await getErpBiModule({ page: 1, limit: 20 });
    const rev = bi.kpis?.find((k) => k.key === "rev_monthly");
    sources.push("orders", "bi");
    return {
      answer: `A receita mensal realizada é R$ ${rev?.value ?? 0}. Crescimento: ${bi.kpis?.find((k) => k.key === "growth")?.value ?? 0}% vs. mês anterior.`,
      kpis: bi.kpis?.slice(0, 6),
      charts: bi.charts?.slice(0, 1),
      sources,
      aiPowered: false,
    };
  }

  if (q.includes("parceiro") && (q.includes("vendeu") || q.includes("mais"))) {
    const bi = await getErpBiModule({ page: 1, limit: 20 });
    const chart = bi.charts?.find((c) => c.id === "revenue_partner");
    const top = chart?.series[0]?.points[0];
    sources.push("orders", "partners");
    return {
      answer: top
        ? `O parceiro com maior receita registrada é "${top.label}" com R$ ${top.value}.`
        : "Ainda não há receita consolidada por parceiro no período.",
      charts: chart ? [chart] : [],
      sources,
      aiPowered: false,
    };
  }

  if (q.includes("fraude") || q.includes("suspeit")) {
    const failed = await prisma.loginLog.count({
      where: { success: false, createdAt: { gte: new Date(Date.now() - 7 * 86400000) } },
    });
    const suspiciousPayments = await prisma.payment.count({ where: { status: "FAILED" } });
    sources.push("loginLog", "payments");
    return {
      answer: `Nas últimas 7 dias: ${failed} falhas de login e ${suspiciousPayments} pagamentos com falha registrados. Revise /admin/ciberseguranca e /admin/financeiro.`,
      kpis: [
        { key: "failed_logins", label: "Falhas login (7d)", value: failed },
        { key: "failed_payments", label: "Pagamentos falhos", value: suspiciousPayments },
      ],
      sources,
      aiPowered: false,
    };
  }

  if (q.includes("fluxo de caixa") || q.includes("fluxo")) {
    const fin = await getAdminFinanceModule({ page: 1, limit: 20 });
    const cf = fin.cashflow as Record<string, number> | undefined;
    sources.push("orders", "payments", "financialTransaction");
    return {
      answer: cf
        ? `Fluxo de caixa: entradas realizadas R$ ${cf.entradasRealizadas}, saídas R$ ${cf.saidasRealizadas}, saldo real R$ ${cf.saldoReal}.`
        : "Dados de fluxo de caixa indisponíveis — verifique pedidos e transações financeiras.",
      sources,
      aiPowered: false,
    };
  }

  if (q.includes("integra") && q.includes("falh")) {
    const int = await getAdminIntegrationsModule();
    const errors = int.integrations?.filter((i: { status: string }) => i.status === "ERROR") ?? [];
    sources.push("integrations");
    return {
      answer:
        errors.length > 0
          ? `Integrações com erro: ${errors.map((e: { name: string }) => e.name).join(", ")}.`
          : "Nenhuma integração em estado ERROR no último health check.",
      sources,
      aiPowered: false,
    };
  }

  if (q.includes("ia") && (q.includes("gast") || q.includes("custo"))) {
    const sessions = await prisma.aiSession.count({
      where: { createdAt: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) } },
    });
    const cost = Math.round(sessions * 0.02 * 100) / 100;
    sources.push("aiSession");
    return {
      answer: `Este mês: ${sessions} sessões de IA. Custo estimado: R$ ${cost} (baseado em uso registrado).`,
      kpis: [
        { key: "ai_sessions", label: "Sessões IA", value: sessions },
        { key: "ai_cost", label: "Custo est. (R$)", value: cost },
      ],
      sources,
      aiPowered: false,
    };
  }

  if (q.includes("cidade") && q.includes("cresceu")) {
    const bi = await getErpBiModule({ page: 1, limit: 20 });
    const chart = bi.charts?.find((c) => c.id === "revenue_city");
    const top = chart?.series[0]?.points[0];
    sources.push("orders", "users");
    return {
      answer: top
        ? `A cidade com maior receita associada é ${top.label} (R$ ${top.value}).`
        : "Sem dados geográficos suficientes para ranking de cidades.",
      charts: chart ? [chart] : [],
      sources,
      aiPowered: false,
    };
  }

  const bi = await getErpBiModule({ page: 1, limit: 20 });
  sources.push("bi", "orders", "users");
  return {
    answer: `Resumo executivo: receita mensal R$ ${bi.kpis?.find((k) => k.key === "rev_monthly")?.value ?? 0}, ${bi.kpis?.find((k) => k.key === "conversion")?.value ?? 0}% conversão, ticket médio R$ ${bi.kpis?.find((k) => k.key === "avg_ticket")?.value ?? 0}. Reformule a pergunta para detalhes específicos.`,
    kpis: bi.kpis?.slice(0, 8),
    sources,
    aiPowered: isOpenAiConfigured(),
  };
}
