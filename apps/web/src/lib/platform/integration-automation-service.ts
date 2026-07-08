import { prisma } from "@/lib/prisma";
import { DEFAULT_AUTOMATION_TEMPLATES } from "@/lib/workflows/workflow-registry";
import { getIntegrationHealthSummary, listGlobalIntegrations } from "@/lib/integrations/integration-registry";
import { paginationArgs } from "@/lib/gestor/gestor-filters";
import type { GestorFilters } from "@/lib/gestor/gestor-filters";

export async function seedAutomationTemplates() {
  for (const tpl of DEFAULT_AUTOMATION_TEMPLATES) {
    await prisma.automationTemplate.upsert({
      where: { slug: tpl.slug },
      create: {
        slug: tpl.slug,
        name: tpl.name,
        description: tpl.description,
        triggerEvent: tpl.triggerEvent,
        actions: tpl.actions as object,
        isCritical: tpl.isCritical ?? false,
        isActive: true,
      },
      update: {
        name: tpl.name,
        description: tpl.description,
        triggerEvent: tpl.triggerEvent,
        actions: tpl.actions as object,
        isCritical: tpl.isCritical ?? false,
      },
    });
    await prisma.workflowDefinition.upsert({
      where: { id: `template-${tpl.slug}` },
      create: {
        id: `template-${tpl.slug}`,
        name: `template:${tpl.slug}`,
        description: tpl.description,
        triggerType: "event",
        triggerConfig: { eventType: tpl.triggerEvent },
        actions: tpl.actions as object,
        isActive: true,
        lifecycleStatus: "ACTIVE",
      },
      update: {
        description: tpl.description,
        triggerConfig: { eventType: tpl.triggerEvent },
        actions: tpl.actions as object,
        isActive: true,
      },
    });
  }
}

export async function getAdminIntegrationsHubModule(_filters: GestorFilters) {
  const health = await getIntegrationHealthSummary();
  const webhooks24h = await prisma.webhookEvent.count({
    where: { createdAt: { gte: new Date(Date.now() - 86400000) } },
  });
  const kpis = [
    { key: "active", label: "Integrações ativas", value: health.active },
    { key: "not_configured", label: "Não configuradas", value: health.notConfigured },
    { key: "error", label: "Com erro", value: health.error },
    { key: "webhooks", label: "Webhooks (24h)", value: webhooks24h },
    { key: "failures", label: "Falhas (24h)", value: health.failures24h },
    { key: "health_check", label: "Último health check", value: health.lastHealthCheck ?? "—" },
  ];
  return {
    kpis,
    metrics: kpis,
    items: health.items.map((i) => ({
      id: i.id,
      integracao: i.name,
      categoria: i.category,
      status: i.status,
      ambiente: i.environment,
      configurada: i.configured ? "Sim" : "Não",
      ultimoSucesso: i.lastSuccessAt ?? "—",
      ultimoErro: i.lastErrorAt ?? "—",
      webhooks: i.webhooksEnabled ? "Sim" : "Não",
    })),
    tabs: [
      { id: "internas", label: "Internas" },
      { id: "externas", label: "Externas" },
      { id: "webhooks", label: "Webhooks" },
      { id: "credenciais", label: "Credenciais" },
      { id: "logs", label: "Logs" },
      { id: "health", label: "Health Check" },
    ],
    disclaimer: health.items.length === 0 ? "Nenhuma integração no catálogo." : undefined,
  };
}

export async function getAdminAutomationsHubModule(filters: GestorFilters) {
  await seedAutomationTemplates();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [workflows, executionsToday, failedExecutions, pendingJobs, failedJobs, templates] = await Promise.all([
    prisma.workflowDefinition.count({ where: { isActive: true, lifecycleStatus: "ACTIVE" } }),
    prisma.workflowInstance.count({ where: { startedAt: { gte: today } } }),
    prisma.workflowInstance.count({ where: { status: "FAILED", startedAt: { gte: today } } }),
    prisma.jobQueue.count({ where: { status: "PENDING" } }),
    prisma.jobQueue.count({ where: { status: "FAILED" } }),
    prisma.automationTemplate.count({ where: { isActive: true, isCritical: true } }),
  ]);
  const kpis = [
    { key: "workflows", label: "Workflows ativos", value: workflows },
    { key: "executions", label: "Execuções hoje", value: executionsToday },
    { key: "errors", label: "Execuções com erro", value: failedExecutions },
    { key: "jobs_pending", label: "Jobs pendentes", value: pendingJobs },
    { key: "jobs_failed", label: "Jobs falhos", value: failedJobs },
    { key: "critical", label: "Automações críticas", value: templates },
  ];
  const defs = await prisma.workflowDefinition.findMany({
    orderBy: { updatedAt: "desc" },
    take: filters.limit,
    include: { instances: { take: 1, orderBy: { startedAt: "desc" } } },
  });
  return {
    kpis,
    metrics: kpis,
    items: defs.map((d) => ({
      id: d.id,
      workflow: d.name,
      gatilho: (d.triggerConfig as { eventType?: string }).eventType ?? d.triggerType,
      status: d.lifecycleStatus,
      ultimaExecucao: d.instances[0]?.startedAt?.toISOString() ?? "—",
      erro: d.instances[0]?.status === "FAILED" ? "Sim" : "—",
    })),
    tabs: [
      { id: "workflows", label: "Workflows" },
      { id: "triggers", label: "Gatilhos" },
      { id: "actions", label: "Ações" },
      { id: "executions", label: "Execuções" },
      { id: "errors", label: "Erros" },
      { id: "templates", label: "Templates" },
    ],
    disclaimer: defs.length === 0 ? "Nenhum workflow cadastrado. Use templates ou crie manualmente." : undefined,
  };
}

export async function getAdminEventsModule(filters: GestorFilters) {
  const [items, total] = await Promise.all([
    prisma.systemEvent.findMany({
      orderBy: { createdAt: "desc" },
      ...paginationArgs(filters),
      include: { actor: { select: { name: true, role: true } } },
    }),
    prisma.systemEvent.count(),
  ]);
  return {
    kpis: [{ key: "total", label: "Eventos totais", value: total }],
    items: items.map((e) => ({
      id: e.id,
      data: e.createdAt.toISOString(),
      tipo: e.type,
      ator: e.actor?.name ?? "—",
      role: e.actorRole ?? e.actor?.role ?? "—",
      entidade: e.entityType ? `${e.entityType}#${e.entityId?.slice(0, 8)}` : "—",
      severidade: e.severity,
      resumo: JSON.stringify(e.payload ?? {}).slice(0, 80),
    })),
    pagination: { page: filters.page, limit: filters.limit, total, pages: Math.ceil(total / filters.limit) || 1 },
    disclaimer: items.length === 0 ? "Nenhum evento registrado ainda." : undefined,
  };
}

export async function getAdminWebhooksModule(filters: GestorFilters) {
  const [items, total] = await Promise.all([
    prisma.webhookEvent.findMany({
      orderBy: { createdAt: "desc" },
      ...paginationArgs(filters),
    }),
    prisma.webhookEvent.count(),
  ]);
  return {
    kpis: [
      { key: "total", label: "Webhooks recebidos", value: total },
      { key: "pending", label: "Pendentes", value: await prisma.webhookEvent.count({ where: { status: "PENDING" } }) },
      { key: "failed", label: "Falhos", value: await prisma.webhookEvent.count({ where: { status: "FAILED" } }) },
    ],
    items: items.map((w) => ({
      id: w.id,
      provider: w.provider,
      evento: w.eventType,
      status: w.status,
      externalId: w.externalId ?? "—",
      criadoEm: w.createdAt.toISOString(),
      processadoEm: w.processedAt?.toISOString() ?? "—",
      erro: w.errorMessage ?? "—",
    })),
    pagination: { page: filters.page, limit: filters.limit, total, pages: Math.ceil(total / filters.limit) || 1 },
    disclaimer: items.length === 0 ? "Nenhum webhook recebido." : undefined,
  };
}

export async function getAdminJobsModule(filters: GestorFilters) {
  const where = filters.status ? { status: filters.status as "PENDING" | "FAILED" | "COMPLETED" } : {};
  const [items, total] = await Promise.all([
    prisma.jobQueue.findMany({ where, orderBy: { createdAt: "desc" }, ...paginationArgs(filters) }),
    prisma.jobQueue.count({ where }),
  ]);
  return {
    kpis: [
      { key: "pending", label: "Pendentes", value: await prisma.jobQueue.count({ where: { status: "PENDING" } }) },
      { key: "failed", label: "Falhos", value: await prisma.jobQueue.count({ where: { status: "FAILED" } }) },
      { key: "running", label: "Em execução", value: await prisma.jobQueue.count({ where: { status: "RUNNING" } }) },
    ],
    items: items.map((j) => ({
      id: j.id,
      job: j.type,
      status: j.status,
      tentativas: j.attempts,
      agendado: j.scheduledAt.toISOString(),
      erro: j.lastError ?? "—",
    })),
    pagination: { page: filters.page, limit: filters.limit, total, pages: Math.ceil(total / filters.limit) || 1 },
    disclaimer: items.length === 0 ? "Nenhum job na fila." : undefined,
  };
}

export async function getAdminFilasModule(filters: GestorFilters) {
  return getAdminJobsModule(filters);
}

export async function getAdminIntegrationLogsModule(filters: GestorFilters) {
  const logs = await prisma.platformIntegrationLog.findMany({
    orderBy: { createdAt: "desc" },
    ...paginationArgs(filters),
  });
  const total = await prisma.platformIntegrationLog.count();
  return {
    kpis: [{ key: "logs", label: "Logs de integração", value: total }],
    items: logs.map((l) => ({
      id: l.id,
      integracao: l.integrationName,
      acao: l.action,
      status: l.status,
      mensagem: l.message ?? "—",
      criadoEm: l.createdAt.toISOString(),
    })),
    pagination: { page: filters.page, limit: filters.limit, total, pages: Math.ceil(total / filters.limit) || 1 },
    disclaimer: logs.length === 0 ? "Nenhum log de integração." : undefined,
  };
}
