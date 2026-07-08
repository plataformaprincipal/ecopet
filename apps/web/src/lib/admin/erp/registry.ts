import { prisma } from "@/lib/prisma";
import type { GestorFilters } from "@/lib/gestor/gestor-filters";
import {
  getAdminExecutiveDashboard,
  getAdminFinanceModule,
  getAdminAccountingModule,
  getAdminLegalModule,
  getAdminHrModule,
  getAdminItModule,
  getAdminInnovationModule,
  getAdminMarketingModule,
  getAdminAdministrativeModule,
  getAdminPermissionsModule,
  getAdminLaboratoryModule,
  getAdminCommercialModule,
  getAdminTechnicalModule,
  getAdminIntegrationsModule,
} from "@/lib/admin/dashboard-service";
import { getGestorAudit } from "@/lib/gestor/gestor-social-service";
import { getGestorPartners, getGestorOngs } from "@/lib/gestor/gestor-users-service";
import { getGestorMarketplace } from "@/lib/gestor/gestor-marketplace-service";
import { getGestorSocial } from "@/lib/gestor/gestor-social-service";
import { getGestorSupport } from "@/lib/gestor/gestor-support-service";
import {
  getAdminEmpresaModule,
  getAdminOperacaoModule,
  getAdminIntegracoesExpandedModule,
  getAdminAutomacoesExpandedModule,
  getAdminIaCenterExpandedModule,
  getAdminAuditoriaExpandedModule,
  getAdminConfiguracoesModule,
  getAdminPermissoesExpandedModule,
} from "@/lib/admin/erp/admin-internal-service";
import {
  getAdminModeracaoModule,
  getAdminContasModule,
  getAdminSuporteModule,
  getAdminComunidadeModule,
  getAdminLojasModule,
  getAdminPerfisModule,
  getAdminMensagensModule,
  getAdminReputacaoModule,
  getAdminIncidentesModule,
  getAdminGovernancaModule,
} from "@/lib/admin/governance/governance-erp-service";
import {
  getAdminIntegrationsHubModule,
  getAdminAutomationsHubModule,
  getAdminEventsModule,
  getAdminWebhooksModule,
  getAdminJobsModule,
  getAdminFilasModule,
  getAdminIntegrationLogsModule,
} from "@/lib/platform/integration-automation-service";
import { getErpBiModule } from "@/lib/admin/erp/bi-service";
import { auditToTimeline, buildAiInsights, normalizeErpResponse, PAID } from "@/lib/admin/erp/enrich";
import type { ErpModuleResponse } from "@/lib/admin/erp/types";

type Handler = (filters: GestorFilters) => Promise<ErpModuleResponse>;

async function loadEnrichment(moduleHint: string) {
  const [audit, workflows] = await Promise.all([
    prisma.auditLog.findMany({
      where: moduleHint ? { module: { contains: moduleHint, mode: "insensitive" } } : undefined,
      orderBy: { createdAt: "desc" },
      take: 20,
      select: {
        id: true,
        action: true,
        module: true,
        observation: true,
        createdAt: true,
        actor: { select: { name: true } },
      },
    }),
    prisma.workflowInstance.findMany({
      orderBy: { startedAt: "desc" },
      take: 10,
      include: { definition: { select: { name: true, triggerType: true } } },
    }),
  ]);
  return {
    timeline: auditToTimeline(audit),
    workflows: workflows.map((w) => ({
      id: w.id,
      name: w.definition.name,
      status: w.status,
      trigger: w.definition.triggerType,
      startedAt: w.startedAt.toISOString(),
    })),
  };
}

async function wrap(moduleId: string, handler: () => Promise<Record<string, unknown>>, hint?: string): Promise<ErpModuleResponse> {
  const [raw, extra] = await Promise.all([handler(), loadEnrichment(hint ?? moduleId)]);
  const base = normalizeErpResponse(moduleId, raw);
  const growth = typeof base.kpis?.find((k) => k.key.includes("growth"))?.value === "number"
    ? (base.kpis!.find((k) => k.key.includes("growth"))!.value as number)
    : undefined;
  return {
    ...base,
    moduleId,
    timeline: base.timeline?.length ? base.timeline : extra.timeline,
    workflows: base.workflows?.length ? base.workflows : extra.workflows,
    aiInsights: base.aiInsights?.length
      ? base.aiInsights
      : buildAiInsights({ revenueGrowth: growth, moduleId }),
  };
}

async function getControladoria(filters: GestorFilters): Promise<ErpModuleResponse> {
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const [revenue, expenses, orders] = await Promise.all([
    prisma.order.aggregate({ where: { createdAt: { gte: monthStart }, status: { in: [...PAID] } }, _sum: { total: true } }),
    prisma.financialTransaction.aggregate({ where: { type: "EXPENSE", createdAt: { gte: monthStart } }, _sum: { amount: true } }),
    prisma.order.count({ where: { createdAt: { gte: monthStart } } }),
  ]);
  const rev = revenue._sum.total ?? 0;
  const exp = expenses._sum.amount ?? 0;
  const margin = rev > 0 ? Math.round(((rev - exp) / rev) * 1000) / 10 : 0;
  const kpis = [
    { key: "revenue", label: "Receita (mês)", value: Math.round(rev * 100) / 100 },
    { key: "expenses", label: "Despesas (mês)", value: Math.round(exp * 100) / 100 },
    { key: "margin", label: "Margem (%)", value: margin },
    { key: "ebitda", label: "EBITDA est.", value: Math.round((rev - exp) * 100) / 100 },
    { key: "roi", label: "ROI est. (%)", value: exp > 0 ? Math.round((rev / exp) * 100) / 100 : 0 },
    { key: "orders", label: "Pedidos (mês)", value: orders },
  ];
  return wrap("controladoria", async () => ({
    kpis,
    metrics: kpis,
    charts: [
      {
        id: "budget",
        type: "bar" as const,
        title: "Realizado x Orçado (est.)",
        series: [
          {
            name: "Valores",
            points: [
              { label: "Receita real", value: rev },
              { label: "Receita orçada", value: rev * 1.1 },
              { label: "Despesa real", value: exp },
            ],
          },
        ],
      },
    ],
    tabs: [
      { id: "indicators", label: "Indicadores" },
      { id: "forecast", label: "Forecast" },
      { id: "budget", label: "Orçamento" },
    ],
  }));
}

async function getCybersecurity(_filters: GestorFilters): Promise<ErpModuleResponse> {
  const dayAgo = new Date(Date.now() - 86400000);
  const [failedLogins, sessions, blocked, privacyOpen, loginLogs] = await Promise.all([
    prisma.loginLog.count({ where: { success: false, createdAt: { gte: dayAgo } } }),
    prisma.userSession.count({ where: { active: true, expiresAt: { gt: new Date() } } }),
    prisma.user.count({ where: { accountStatus: "SUSPENDED" } }),
    prisma.dataPrivacyRequest.count({ where: { status: "OPEN" } }),
    prisma.loginLog.findMany({
      where: { createdAt: { gte: dayAgo } },
      orderBy: { createdAt: "desc" },
      take: 30,
      select: { id: true, success: true, ip: true, createdAt: true, email: true },
    }),
  ]);
  const kpis = [
    { key: "failed_logins", label: "Falhas login (24h)", value: failedLogins, variant: failedLogins > 20 ? "critical" as const : "default" as const },
    { key: "sessions", label: "Sessões ativas", value: sessions },
    { key: "blocked", label: "Usuários bloqueados", value: blocked },
    { key: "lgpd", label: "Solicitações LGPD", value: privacyOpen },
  ];
  return wrap("ciberseguranca", async () => ({
    kpis,
    metrics: kpis,
    items: loginLogs.map((l) => ({
      data: l.createdAt.toISOString(),
      email: l.email ?? "—",
      ip: l.ip ?? "—",
      sucesso: l.success ? "Sim" : "Não",
    })),
    tabs: [
      { id: "overview", label: "Visão geral" },
      { id: "sessions", label: "Sessões" },
      { id: "lgpd", label: "LGPD" },
      { id: "audit", label: "Auditoria" },
    ],
    aiInsights: buildAiInsights({ failedLogins }),
  }));
}

async function getAnalytics(_filters: GestorFilters): Promise<ErpModuleResponse> {
  const [metrics, auditCount, orders, users] = await Promise.all([
    prisma.systemMetric.findMany({ orderBy: { date: "desc" }, take: 30 }),
    prisma.auditLog.count(),
    prisma.order.count(),
    prisma.user.count(),
  ]);
  const kpis = [
    { key: "events", label: "Eventos sistema", value: metrics.length },
    { key: "audit", label: "Logs auditoria", value: auditCount },
    { key: "orders", label: "Pedidos totais", value: orders },
    { key: "users", label: "Usuários", value: users },
  ];
  return wrap("analytics", async () => ({
    kpis,
    metrics: kpis,
    items: metrics.map((m) => ({
      metrica: m.metricKey,
      valor: m.value,
      data: m.date.toISOString(),
    })),
    charts: metrics.length
      ? [
          {
            id: "metrics_line",
            type: "line" as const,
            title: "Métricas do sistema",
            series: [
              {
                name: "Valor",
                points: metrics.map((m) => ({ label: m.date.toISOString().slice(0, 10), value: m.value })),
              },
            ],
          },
        ]
      : [],
    disclaimer: metrics.length === 0 ? "Nenhuma métrica em SystemMetric — estrutura pronta para ingestão de eventos." : undefined,
  }));
}

async function getAutomations(_filters: GestorFilters): Promise<ErpModuleResponse> {
  const [defs, instances] = await Promise.all([
    prisma.workflowDefinition.findMany({ orderBy: { updatedAt: "desc" }, take: 20 }),
    prisma.workflowInstance.findMany({ orderBy: { startedAt: "desc" }, take: 20, include: { definition: true } }),
  ]);
  const kpis = [
    { key: "definitions", label: "Fluxos cadastrados", value: defs.length },
    { key: "active", label: "Fluxos ativos", value: defs.filter((d) => d.isActive).length },
    { key: "instances", label: "Execuções", value: instances.length },
    { key: "running", label: "Em execução", value: instances.filter((i) => i.status === "RUNNING").length },
  ];
  return wrap("automacoes", async () => ({
    kpis,
    metrics: kpis,
    items: defs.map((d) => ({
      nome: d.name,
      trigger: d.triggerType,
      status: d.isActive ? "ATIVO" : "INATIVO",
      atualizado: d.updatedAt.toISOString(),
    })),
    tabs: [
      { id: "flows", label: "Fluxos" },
      { id: "executions", label: "Execuções" },
      { id: "templates", label: "Modelos" },
    ],
    disclaimer: defs.length === 0 ? "Nenhum fluxo cadastrado. Crie WorkflowDefinition para automações tipo Zapier." : undefined,
  }));
}

async function getDataCenter(_filters: GestorFilters): Promise<ErpModuleResponse> {
  let dbOk = false;
  try {
    await prisma.$queryRaw`SELECT 1`;
    dbOk = true;
  } catch {
    dbOk = false;
  }
  const [users, orders, audit] = await Promise.all([
    prisma.user.count(),
    prisma.order.count(),
    prisma.auditLog.count(),
  ]);
  const kpis = [
    { key: "db", label: "Banco de dados", value: dbOk ? "Conectado" : "Erro" },
    { key: "users", label: "Registros usuários", value: users },
    { key: "orders", label: "Registros pedidos", value: orders },
    { key: "audit", label: "Registros auditoria", value: audit },
  ];
  return wrap("data-center", async () => ({
    kpis,
    metrics: kpis,
    tabs: [
      { id: "import", label: "Importação" },
      { id: "export", label: "Exportação" },
      { id: "backups", label: "Backups" },
      { id: "migrations", label: "Migrações" },
    ],
    disclaimer: "Backups e snapshots dependem da infraestrutura (Supabase/Vercel). Exportação via módulos individuais.",
  }));
}

async function getProduct(_filters: GestorFilters): Promise<ErpModuleResponse> {
  const [products, services, flags, reports, feedbacks] = await Promise.all([
    prisma.product.count({ where: { deletedAt: null } }),
    prisma.service.count({ where: { deletedAt: null } }),
    prisma.featureFlag.count(),
    prisma.contentReport.count({ where: { status: "PENDING" } }),
    prisma.aIFeedback.count(),
  ]);
  const kpis = [
    { key: "products", label: "Produtos", value: products },
    { key: "services", label: "Serviços", value: services },
    { key: "features", label: "Feature flags", value: flags },
    { key: "bugs", label: "Denúncias abertas", value: reports },
    { key: "feedbacks", label: "Feedbacks", value: feedbacks },
  ];
  return wrap("produto", async () => ({
    kpis,
    metrics: kpis,
    tables: [
      { id: "roadmap", label: "Roadmap", rows: [] },
      { id: "backlog", label: "Backlog", rows: [] },
      { id: "bugs", label: "Bugs / denúncias", rows: [] },
      { id: "releases", label: "Releases", rows: [] },
      { id: "experiments", label: "Experimentos", rows: flags > 0 ? [{ id: "flags", item: "Feature flags ativos", qtd: flags }] : [] },
    ],
    tabs: [
      { id: "roadmap", label: "Roadmap" },
      { id: "backlog", label: "Backlog" },
      { id: "bugs", label: "Bugs" },
      { id: "releases", label: "Releases" },
      { id: "experiments", label: "Experimentos" },
    ],
    disclaimer: "Roadmap/backlog via ferramentas externas. Contadores de produto, flags e feedbacks são reais.",
  }));
}

async function getFinanceErp(filters: GestorFilters): Promise<ErpModuleResponse> {
  const base = await getAdminFinanceModule(filters);
  const [payable, receivable] = await Promise.all([
    prisma.financialTransaction.count({ where: { type: "EXPENSE" } }),
    prisma.financialTransaction.count({ where: { type: "INCOME" } }),
  ]);
  const extraKpis = [
    { key: "payable", label: "Contas a pagar", value: payable },
    { key: "receivable", label: "Contas a receber", value: receivable },
    { key: "subscriptions", label: "Assinaturas", value: await prisma.subscription.count() },
  ];
  return wrap("financeiro", async () => ({
    ...base,
    kpis: [...(base.metrics ?? []), ...extraKpis],
    metrics: [...(base.metrics ?? []), ...extraKpis],
  }), "finance");
}

const REGISTRY: Record<string, Handler> = {
  dashboard: (f) => wrap("dashboard", () => getAdminExecutiveDashboard(f)),
  empresa: (f) => wrap("empresa", () => getAdminEmpresaModule(f)),
  operacao: (f) => wrap("operacao", () => getAdminOperacaoModule(f)),
  bi: getErpBiModule,
  financeiro: getFinanceErp,
  contabil: (f) => wrap("contabil", () => getAdminAccountingModule(f), "accounting"),
  controladoria: getControladoria,
  juridico: (f) => wrap("juridico", () => getAdminLegalModule(f), "legal"),
  rh: (f) => wrap("rh", () => getAdminHrModule(f), "hr"),
  ti: (f) => wrap("ti", () => getAdminItModule(f), "it"),
  ciberseguranca: getCybersecurity,
  seguranca: getCybersecurity,
  inovacao: (f) => wrap("inovacao", () => getAdminInnovationModule(f), "ai"),
  "ia-center": (f) => wrap("ia-center", () => getAdminIaCenterExpandedModule(f), "ai"),
  ia: (f) => wrap("ia", () => getAdminIaCenterExpandedModule(f), "ai"),
  marketing: (f) => wrap("marketing", () => getAdminMarketingModule(f)),
  administrativo: (f) => wrap("administrativo", () => getAdminAdministrativeModule(f)),
  permissoes: (f) => wrap("permissoes", () => getAdminPermissoesExpandedModule(f)),
  laboratorio: (f) => wrap("laboratorio", () => getAdminLaboratoryModule(f)),
  comercial: (f) => wrap("comercial", () => getAdminCommercialModule(f)),
  crm: (f) => wrap("crm", () => getAdminCommercialModule(f)),
  tecnico: (f) => wrap("tecnico", () => getAdminTechnicalModule(f)),
  suporte: (f) => wrap("suporte", () => getAdminSuporteModule(f), "support"),
  integracoes: (f) => wrap("integracoes", () => getAdminIntegrationsHubModule(f)),
  partners: (f) => wrap("partners", () => getGestorPartners(f)),
  ngos: (f) => wrap("ngos", () => getGestorOngs(f)),
  marketplace: (f) => wrap("marketplace", () => getGestorMarketplace(f)),
  social: (f) => wrap("social", () => getGestorSocial(f)),
  audit: (f) => wrap("audit", () => getGestorAudit(f)),
  auditoria: (f) => wrap("auditoria", () => getAdminAuditoriaExpandedModule(f)),
  configuracoes: () => wrap("configuracoes", () => getAdminConfiguracoesModule()),
  analytics: getAnalytics,
  automacoes: (f) => wrap("automacoes", () => getAdminAutomationsHubModule(f)),
  "data-center": getDataCenter,
  produto: getProduct,
  moderacao: (f) => wrap("moderacao", () => getAdminModeracaoModule(f), "governance"),
  contas: (f) => wrap("contas", () => getAdminContasModule(f), "governance.accounts"),
  comunidade: (f) => wrap("comunidade", () => getAdminComunidadeModule(f), "governance.community"),
  lojas: (f) => wrap("lojas", () => getAdminLojasModule(f), "governance.stores"),
  perfis: (f) => wrap("perfis", () => getAdminPerfisModule(f), "governance.profiles"),
  mensagens: (f) => wrap("mensagens", () => getAdminMensagensModule(f), "governance.messages"),
  reputacao: (f) => wrap("reputacao", () => getAdminReputacaoModule(f), "governance.reputation"),
  incidentes: (f) => wrap("incidentes", () => getAdminIncidentesModule(f), "governance.incidents"),
  governanca: (f) => wrap("governanca", () => getAdminGovernancaModule(f), "governance"),
  eventos: (f) => wrap("eventos", () => getAdminEventsModule(f), "platform.events"),
  webhooks: (f) => wrap("webhooks", () => getAdminWebhooksModule(f), "platform.webhooks"),
  jobs: (f) => wrap("jobs", () => getAdminJobsModule(f), "platform.jobs"),
  filas: (f) => wrap("filas", () => getAdminFilasModule(f), "platform.jobs"),
  workflows: (f) => wrap("workflows", () => getAdminAutomationsHubModule(f), "platform.workflows"),
  "logs-integracao": (f) => wrap("logs-integracao", () => getAdminIntegrationLogsModule(f), "platform.integrations"),
};

export async function getErpModule(moduleId: string, filters: GestorFilters): Promise<ErpModuleResponse> {
  const handler = REGISTRY[moduleId];
  if (!handler) {
    return {
      moduleId,
      kpis: [],
      items: [],
      disclaimer: `Módulo "${moduleId}" não registrado no ERP.`,
    };
  }
  return handler(filters);
}

export const ERP_MODULE_IDS = Object.keys(REGISTRY);
