import type { ErpAiInsight, ErpAlert, ErpChart, ErpKpi, ErpModuleResponse, ErpTimelineEvent } from "./types";

const PAID = ["PAID", "COMPLETED", "DELIVERED", "SHIPPED", "CONFIRMED"] as const;

export function pctChange(current: number, previous: number): number | undefined {
  if (previous === 0) return current > 0 ? 100 : undefined;
  return Math.round(((current - previous) / previous) * 1000) / 10;
}

export function buildAiInsights(data: {
  revenueGrowth?: number;
  openTickets?: number;
  openReports?: number;
  integrationErrors?: number;
  pendingApprovals?: number;
  failedLogins?: number;
  moduleId?: string;
}): ErpAiInsight[] {
  const insights: ErpAiInsight[] = [];

  if (data.revenueGrowth !== undefined && data.revenueGrowth < -10) {
    insights.push({
      id: "rev-drop",
      title: "Queda de receita detectada",
      description: `Receita mensal ${data.revenueGrowth}% vs. mês anterior. Revise conversão e parceiros inativos.`,
      priority: "high",
      actionHref: "/admin/bi",
      metric: "revenue_growth",
    });
  } else if (data.revenueGrowth !== undefined && data.revenueGrowth > 15) {
    insights.push({
      id: "rev-up",
      title: "Crescimento acelerado",
      description: `Receita mensal +${data.revenueGrowth}% vs. mês anterior. Considere reforçar operação e estoque.`,
      priority: "medium",
      actionHref: "/admin/bi",
    });
  }

  if ((data.openTickets ?? 0) > 5) {
    insights.push({
      id: "tickets",
      title: "Volume elevado de tickets",
      description: `${data.openTickets} tickets abertos. Priorize SLA e escalonamento.`,
      priority: "high",
      actionHref: "/admin/suporte",
    });
  }

  if ((data.openReports ?? 0) > 0) {
    insights.push({
      id: "reports",
      title: "Denúncias pendentes",
      description: `${data.openReports} denúncia(s) aguardando moderação.`,
      priority: "medium",
      actionHref: "/admin/social",
    });
  }

  if ((data.integrationErrors ?? 0) > 0) {
    insights.push({
      id: "integrations",
      title: "Integrações com falha",
      description: `${data.integrationErrors} erro(s) recente(s) em integrações. Verifique logs.`,
      priority: "high",
      actionHref: "/admin/integracoes",
    });
  }

  if ((data.pendingApprovals ?? 0) > 0) {
    insights.push({
      id: "approvals",
      title: "Cadastros pendentes",
      description: `${data.pendingApprovals} parceiro(s)/ONG(s) aguardando aprovação.`,
      priority: "medium",
      actionHref: "/admin/approvals",
    });
  }

  if ((data.failedLogins ?? 0) > 20) {
    insights.push({
      id: "auth",
      title: "Tentativas de login suspeitas",
      description: `${data.failedLogins} falhas de login nas últimas 24h.`,
      priority: "high",
      actionHref: "/admin/ciberseguranca",
    });
  }

  if (!insights.length) {
    insights.push({
      id: "stable",
      title: "Operação estável",
      description: "Nenhuma anomalia crítica detectada nos indicadores atuais.",
      priority: "low",
    });
  }

  return insights;
}

export function auditToTimeline(
  logs: {
    id: string;
    action: string;
    module: string;
    observation: string | null;
    createdAt: Date;
    actor?: { name: string | null } | null;
  }[]
): ErpTimelineEvent[] {
  return logs.map((l) => ({
    id: l.id,
    date: l.createdAt.toISOString(),
    title: `${l.action} — ${l.module}`,
    description: l.observation ?? undefined,
    actor: l.actor?.name ?? undefined,
    severity: l.action === "DELETE" ? "critical" : "info",
    module: l.module,
  }));
}

export function normalizeErpResponse(moduleId: string, raw: Record<string, unknown>): ErpModuleResponse {
  const metrics = (raw.metrics as ErpKpi[] | undefined) ?? (raw.kpis as ErpKpi[] | undefined);
  return {
    moduleId,
    ...raw,
    kpis: metrics,
    metrics,
    charts: (raw.charts as ErpChart[]) ?? [],
    timeline: (raw.timeline as ErpTimelineEvent[]) ?? [],
    aiInsights: (raw.aiInsights as ErpAiInsight[]) ?? [],
    alerts: (raw.alerts as ErpAlert[]) ?? [],
    workflows: (raw.workflows as ErpModuleResponse["workflows"]) ?? [],
  };
}

export { PAID };
