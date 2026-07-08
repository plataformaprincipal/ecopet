import { AccountStatus, UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { GestorFilters } from "@/lib/gestor/gestor-filters";
import type { ErpModuleResponse } from "@/lib/admin/erp/types";
import {
  ADMIN_ERP_MODULES,
  ADMIN_PERMISSION_ACTIONS,
  ADMIN_ERP_ROLES,
  ADMIN_ROLE_LABELS,
  defaultAdminPermissionMatrix,
} from "@/lib/admin/erp/permissions";
import {
  ADMIN_INTEGRATION_CATALOG,
  buildIntegrationRows,
  EMPTY_INTEGRATIONS_STORE,
  integrationEnvironment,
  type IntegrationsStore,
} from "@/lib/integrations/erp-integration-catalog";
import { getAdminInnovationModule } from "@/lib/admin/dashboard-service";
import { getGestorAudit } from "@/lib/gestor/gestor-social-service";

function monthStart() {
  return new Date(new Date().getFullYear(), new Date().getMonth(), 1);
}

export const ADMIN_INTERNAL_AUTOMATIONS = [
  {
    id: "partner_approved",
    nome: "Parceiro aprovado",
    gatilho: "partner.approved",
    acoes: ["Enviar e-mail", "Liberar painel", "Registrar AuditLog"],
  },
  {
    id: "critical_report",
    nome: "Denúncia crítica",
    gatilho: "report.critical",
    acoes: ["Criar ticket", "Notificar admin"],
  },
  {
    id: "payment_failed",
    nome: "Falha de pagamento",
    gatilho: "payment.failed",
    acoes: ["Alertar financeiro", "Registrar evento"],
  },
  {
    id: "integration_error",
    nome: "Integração com erro",
    gatilho: "integration.error",
    acoes: ["Alertar TI", "Registrar log"],
  },
] as const;

type AdminStore = IntegrationsStore;

async function loadAdminStore(module: string): Promise<AdminStore> {
  const session = await prisma.aiSession.findFirst({
    where: { type: `admin:erp:${module}:platform` },
    orderBy: { updatedAt: "desc" },
  });
  if (!session?.messages) return { ...EMPTY_INTEGRATIONS_STORE };
  return { ...EMPTY_INTEGRATIONS_STORE, ...(session.messages as object) } as AdminStore;
}

export async function getAdminEmpresaModule(_filters: GestorFilters): Promise<Record<string, unknown>> {
  const [users, partners, ongs, orders, campaigns] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { role: UserRole.PARTNER, accountStatus: AccountStatus.ACTIVE } }),
    prisma.user.count({ where: { role: UserRole.ONG, accountStatus: AccountStatus.ACTIVE } }),
    prisma.order.count(),
    prisma.campaign.count(),
  ]);

  return {
    kpis: [
      { key: "users", label: "Usuários", value: users },
      { key: "partners", label: "Parceiros ativos", value: partners },
      { key: "ongs", label: "ONGs ativas", value: ongs },
      { key: "orders", label: "Pedidos", value: orders },
      { key: "campaigns", label: "Campanhas", value: campaigns },
    ],
    tables: [
      {
        id: "company",
        label: "EcoPet — visão corporativa",
        rows: [
          { id: "ecopet", nome: "EcoPet Platform", segmento: "PetTech", usuarios: users, parceiros: partners, ongs },
        ],
      },
      {
        id: "units",
        label: "Unidades de negócio",
        rows: [
          { id: "marketplace", unidade: "Marketplace", status: "ativo" },
          { id: "social", unidade: "Rede Social", status: "ativo" },
          { id: "partner", unidade: "Parceiros", status: "ativo" },
          { id: "ngo", unidade: "ONGs", status: "ativo" },
        ],
      },
    ],
    tabs: [
      { id: "company", label: "Empresa" },
      { id: "units", label: "Unidades" },
    ],
  };
}

export async function getAdminOperacaoModule(filters: GestorFilters): Promise<Record<string, unknown>> {
  const month = monthStart();
  const [
    pendingPartners,
    pendingOngs,
    failedOrders,
    openReports,
    criticalTickets,
    pendingApprovals,
    paymentFailures,
    suspendedPartners,
  ] = await Promise.all([
    prisma.user.count({ where: { role: UserRole.PARTNER, accountStatus: AccountStatus.PENDING } }),
    prisma.user.count({ where: { role: UserRole.ONG, accountStatus: AccountStatus.PENDING } }),
    prisma.order.count({ where: { status: "CANCELLED", createdAt: { gte: month } } }),
    prisma.socialReport.count({ where: { status: "OPEN" } }),
    prisma.supportTicket.count({ where: { priority: "URGENT", status: { in: ["OPEN", "IN_PROGRESS"] } } }),
    prisma.user.count({
      where: { accountStatus: AccountStatus.PENDING, role: { in: [UserRole.PARTNER, UserRole.ONG] } },
    }),
    prisma.paymentEvent.count({
      where: {
        createdAt: { gte: month },
        OR: [{ errorCode: { not: null } }, { status: { in: ["failed", "FAILED", "error", "ERROR"] } }],
      },
    }),
    prisma.user.count({ where: { role: UserRole.PARTNER, accountStatus: AccountStatus.SUSPENDED } }),
  ]);

  const [tickets, reports, approvals] = await Promise.all([
    prisma.supportTicket.findMany({
      where: { priority: { in: ["URGENT", "HIGH"] }, status: { in: ["OPEN", "IN_PROGRESS"] } },
      orderBy: { updatedAt: "desc" },
      take: 15,
      select: { id: true, subject: true, priority: true, status: true, updatedAt: true },
    }),
    prisma.socialReport.findMany({
      where: { status: "OPEN" },
      orderBy: { createdAt: "desc" },
      take: 15,
      select: { id: true, reason: true, status: true, createdAt: true },
    }),
    prisma.user.findMany({
      where: { accountStatus: AccountStatus.PENDING, role: { in: [UserRole.PARTNER, UserRole.ONG] } },
      orderBy: { createdAt: "asc" },
      take: 15,
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    }),
  ]);

  return {
    kpis: [
      { key: "approvals", label: "Aprovações pendentes", value: pendingApprovals, variant: pendingApprovals > 0 ? "warning" : "default" },
      { key: "partners-pending", label: "Parceiros pendentes", value: pendingPartners },
      { key: "ongs-pending", label: "ONGs pendentes", value: pendingOngs },
      { key: "failed-orders", label: "Pedidos com falha", value: failedOrders },
      { key: "reports", label: "Denúncias", value: openReports },
      { key: "critical-tickets", label: "Tickets críticos", value: criticalTickets, variant: criticalTickets > 0 ? "critical" : "default" },
      { key: "payment-failures", label: "Falhas pagamento", value: paymentFailures },
      { key: "problem-partners", label: "Parceiros suspensos", value: suspendedPartners },
    ],
    tables: [
      { id: "approvals", label: "Aprovações pendentes", rows: approvals.map((a) => ({ ...a, cadastro: a.createdAt.toISOString() })) },
      { id: "tickets", label: "Tickets críticos", rows: tickets.map((t) => ({ ...t, atualizado: t.updatedAt.toISOString() })) },
      { id: "reports", label: "Denúncias", rows: reports.map((r) => ({ ...r, data: r.createdAt.toISOString() })) },
      {
        id: "sla",
        label: "SLA operacional",
        rows: [
          { id: "tickets", indicador: "Tickets urgentes", valor: criticalTickets, meta: 0 },
          { id: "approvals", indicador: "Aprovações > 48h", valor: pendingApprovals, meta: 0 },
        ],
      },
      { id: "tasks", label: "Tarefas operacionais", rows: [] },
    ],
    tabs: [
      { id: "approvals", label: "Aprovações" },
      { id: "tickets", label: "Tickets" },
      { id: "reports", label: "Denúncias" },
      { id: "sla", label: "SLA" },
    ],
    quickActions: [
      { label: "Aprovações", href: "/admin/approvals" },
      { label: "Suporte", href: "/admin/suporte" },
      { label: "Social", href: "/admin/social" },
    ],
  };
}

export async function getAdminIntegracoesExpandedModule(): Promise<Record<string, unknown>> {
  const store = await loadAdminStore("integracoes");
  const rows = buildIntegrationRows(ADMIN_INTEGRATION_CATALOG, store);
  const [platformLogs, webhookLogs] = await Promise.all([
    prisma.platformIntegrationLog.findMany({ orderBy: { createdAt: "desc" }, take: 20 }),
    prisma.platformIntegrationLog.findMany({
      where: { action: { contains: "webhook", mode: "insensitive" } },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
  ]);

  return {
    kpis: [
      { key: "total", label: "Integrações", value: rows.length },
      { key: "active", label: "Ativas", value: rows.filter((r) => r.ativo).length },
      { key: "errors", label: "Com erro", value: rows.filter((r) => r.erroRecente && r.erroRecente !== "—").length },
      { key: "env", label: "Ambiente", value: integrationEnvironment() },
      { key: "logs", label: "Logs plataforma", value: platformLogs.length },
    ],
    tables: [
      { id: "integrations", label: "Integrações", rows },
      {
        id: "logs",
        label: "Logs",
        rows: [
          ...store.logs,
          ...platformLogs.map((l) => ({
            id: l.id,
            integrationId: l.integrationName,
            status: l.status,
            message: l.message,
            at: l.createdAt.toISOString(),
          })),
        ].slice(-30),
      },
      {
        id: "webhooks",
        label: "Webhooks",
        rows: webhookLogs.map((l) => ({ id: l.id, evento: l.action, status: l.status, data: l.createdAt.toISOString() })),
      },
    ],
    tabs: [
      { id: "integrations", label: "Integrações" },
      { id: "logs", label: "Logs" },
      { id: "webhooks", label: "Webhooks" },
    ],
    disclaimer: "Tokens mascarados. Teste conexão via POST /api/admin/erp/integracoes.",
  };
}

export async function getAdminAutomacoesExpandedModule(): Promise<Record<string, unknown>> {
  const [defs, instances, logs] = await Promise.all([
    prisma.workflowDefinition.findMany({ orderBy: { updatedAt: "desc" }, take: 20 }),
    prisma.workflowInstance.findMany({
      orderBy: { startedAt: "desc" },
      take: 20,
      include: { definition: { select: { name: true, triggerType: true } } },
    }),
    prisma.workflowExecutionLog.findMany({ orderBy: { createdAt: "desc" }, take: 20 }),
  ]);

  const templateRows = ADMIN_INTERNAL_AUTOMATIONS.map((w) => ({
    id: w.id,
    workflow: w.nome,
    gatilho: w.gatilho,
    acoes: w.acoes.join(" → "),
    status: defs.some((d) => d.name.toLowerCase().includes(w.id.replace("_", " "))) ? "cadastrado" : "template",
  }));

  return {
    kpis: [
      { key: "templates", label: "Templates internos", value: ADMIN_INTERNAL_AUTOMATIONS.length },
      { key: "definitions", label: "Fluxos cadastrados", value: defs.length },
      { key: "instances", label: "Execuções", value: instances.length },
      { key: "logs", label: "Logs execução", value: logs.length },
    ],
    tables: [
      { id: "templates", label: "Workflows internos", rows: templateRows },
      {
        id: "definitions",
        label: "Definições",
        rows: defs.map((d) => ({ id: d.id, nome: d.name, gatilho: d.triggerType, ativo: d.isActive })),
      },
      {
        id: "instances",
        label: "Execuções",
        rows: instances.map((i) => ({ id: i.id, nome: i.definition.name, status: i.status, inicio: i.startedAt.toISOString() })),
      },
      { id: "logs", label: "Logs", rows: logs.map((l) => ({ id: l.id, passo: l.step, status: l.status, data: l.createdAt.toISOString() })) },
    ],
    tabs: [
      { id: "templates", label: "Templates" },
      { id: "definitions", label: "Fluxos" },
      { id: "instances", label: "Execuções" },
      { id: "logs", label: "Logs" },
    ],
  };
}

export async function getAdminIaCenterExpandedModule(filters: GestorFilters): Promise<Record<string, unknown>> {
  const base = await getAdminInnovationModule(filters);
  const month = monthStart();
  const [agents, prompts, models, providers, logs, feedbacks, tokenUsage] = await Promise.all([
    prisma.aIAgent.count(),
    prisma.aIPrompt.count(),
    prisma.aIModel.count(),
    prisma.aIProvider.count(),
    prisma.aILog.findMany({ orderBy: { createdAt: "desc" }, take: 15, select: { id: true, agentId: true, errorCode: true, tokensInput: true, tokensOutput: true, createdAt: true } }),
    prisma.aIFeedback.count(),
    prisma.aITokenUsage.aggregate({ where: { usageDate: { gte: month } }, _sum: { estimatedCost: true, tokensInput: true, tokensOutput: true } }),
  ]);

  const aiCost = tokenUsage._sum.estimatedCost ?? 0;
  const errors = logs.filter((l) => l.errorCode).length;

  return {
    ...base,
    kpis: [
      { key: "agents", label: "Agentes", value: agents },
      { key: "prompts", label: "Prompts", value: prompts },
      { key: "models", label: "Modelos", value: models },
      { key: "providers", label: "Providers", value: providers },
      { key: "cost", label: "Custo IA (mês)", value: Math.round(aiCost * 100) / 100 },
      { key: "tokens", label: "Tokens (mês)", value: (tokenUsage._sum.tokensInput ?? 0) + (tokenUsage._sum.tokensOutput ?? 0) },
      { key: "errors", label: "Erros IA", value: errors, variant: errors > 0 ? "warning" : "default" },
      { key: "feedbacks", label: "Feedbacks", value: feedbacks },
    ],
    tables: [
      { id: "agents", label: "Agentes", rows: [] },
      { id: "logs", label: "Logs IA", rows: logs.map((l) => ({ id: l.id, agente: l.agentId, erro: l.errorCode ?? "—", tokens: l.tokensInput + l.tokensOutput, data: l.createdAt.toISOString() })) },
      { id: "providers", label: "Providers", rows: [] },
    ],
    quickActions: [{ label: "Plataforma AI", href: "/admin/ai" }],
  };
}

export async function getAdminAuditoriaExpandedModule(filters: GestorFilters): Promise<Record<string, unknown>> {
  const audit = await getGestorAudit(filters);
  const [critical, total] = await Promise.all([
    prisma.auditLog.findMany({
      where: { action: { in: ["DELETE", "REJECT"] } },
      orderBy: { createdAt: "desc" },
      take: 20,
      include: { actor: { select: { name: true, email: true } } },
    }),
    prisma.auditLog.count(),
  ]);

  return {
    kpis: [
      { key: "total", label: "Eventos auditoria", value: total },
      { key: "page", label: "Nesta página", value: audit.items.length },
      { key: "critical", label: "Logs críticos", value: critical.length, variant: critical.length > 0 ? "warning" : "default" },
    ],
    items: audit.items,
    tables: [
      {
        id: "timeline",
        label: "Timeline de ações",
        rows: audit.items.map((l) => ({
          id: l.id,
          usuario: l.actor?.name ?? "—",
          acao: l.action,
          modulo: l.module,
          recurso: l.resource,
          data: l.createdAt,
          observacao: l.observation ?? "—",
        })),
      },
      {
        id: "critical",
        label: "Logs críticos",
        rows: critical.map((l) => ({
          id: l.id,
          usuario: l.actor?.name ?? "—",
          acao: l.action,
          modulo: l.module,
          recurso: l.resource,
          data: l.createdAt.toISOString(),
          observacao: l.observation ?? "—",
        })),
      },
    ],
    tabs: [
      { id: "timeline", label: "Timeline" },
      { id: "critical", label: "Críticos" },
      { id: "export", label: "Exportação" },
    ],
    pagination: audit.pagination,
    disclaimer: "Exportação CSV disponível na barra de exportação do módulo.",
  };
}

export async function getAdminConfiguracoesModule(): Promise<Record<string, unknown>> {
  const matrix = defaultAdminPermissionMatrix();
  const matrixRows = ADMIN_ERP_ROLES.flatMap((role) =>
    ADMIN_ERP_MODULES.slice(0, 6).map((mod) => ({
      id: `${role}-${mod}`,
      papel: ADMIN_ROLE_LABELS[role],
      modulo: mod,
      permissoes: ADMIN_PERMISSION_ACTIONS.filter((a) => matrix[role][mod][a]).join(", ") || "—",
    }))
  );

  return {
    kpis: [
      { key: "roles", label: "Papéis internos", value: ADMIN_ERP_ROLES.length },
      { key: "modules", label: "Módulos", value: ADMIN_ERP_MODULES.length },
      { key: "actions", label: "Ações", value: ADMIN_PERMISSION_ACTIONS.length },
    ],
    tables: [
      { id: "roles", label: "Papéis", rows: ADMIN_ERP_ROLES.map((r) => ({ id: r, papel: ADMIN_ROLE_LABELS[r] })) },
      { id: "matrix", label: "Matriz (amostra)", rows: matrixRows },
    ],
    tabs: [
      { id: "roles", label: "Papéis" },
      { id: "matrix", label: "Permissões" },
      { id: "platform", label: "Plataforma" },
    ],
    quickActions: [{ label: "Configurações gerais", href: "/admin/settings" }],
  };
}

export async function getAdminPermissoesExpandedModule(filters: GestorFilters): Promise<Record<string, unknown>> {
  const { getAdminPermissionsModule } = await import("@/lib/admin/dashboard-service");
  const base = await getAdminPermissionsModule(filters);
  const matrix = defaultAdminPermissionMatrix();
  return {
    ...base,
    profileTypes: ADMIN_ERP_ROLES.map((r) => ({ perfil: r, descricao: ADMIN_ROLE_LABELS[r] })),
    permissions: ADMIN_PERMISSION_ACTIONS,
    tables: [
      {
        id: "matrix",
        label: "Matriz de permissões",
        rows: ADMIN_ERP_ROLES.flatMap((role) =>
          ADMIN_ERP_MODULES.map((mod) => ({
            id: `${role}-${mod}`,
            papel: role,
            modulo: mod,
            visualizar: matrix[role][mod].view,
            configurar: matrix[role][mod].configure,
          }))
        ),
      },
    ],
  };
}
