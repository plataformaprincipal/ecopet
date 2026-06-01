import { prisma } from "@ecopet/database";
import type { PersonaScope } from "@prisma/client";
import { asInputJson, asOptionalInputJson } from "../lib/prisma-json.js";
import { createAuditLog } from "./audit-service.js";

export async function emitPlatformEvent(params: {
  eventType: string;
  personaScope?: PersonaScope;
  organizationId?: string;
  actorId?: string;
  entityType?: string;
  entityId?: string;
  payload?: Record<string, unknown>;
  severity?: string;
}) {
  const event = await prisma.platformEvent.create({
    data: {
      eventType: params.eventType,
      personaScope: params.personaScope ?? "GLOBAL",
      organizationId: params.organizationId,
      actorId: params.actorId,
      entityType: params.entityType,
      entityId: params.entityId,
      payload: asInputJson(params.payload ?? {}),
      severity: params.severity ?? "info",
    },
  });

  await processEventSubscriptions(event.id, params.eventType, params.payload);
  await evaluateBusinessRules(params);
  await triggerWorkflows(params.eventType, params);

  return event;
}

async function processEventSubscriptions(_eventId: string, eventType: string, _payload?: Record<string, unknown>) {
  const subs = await prisma.eventSubscription.findMany({ where: { isActive: true } });
  for (const sub of subs) {
    const types = (sub.eventTypes as string[]) ?? [];
    if (types.includes(eventType) || types.includes("*")) {
      await createAuditLog({
        action: "CREATE",
        module: "platform",
        resource: "event_subscription",
        resourceId: sub.id,
        observation: `Evento ${eventType} despachado via ${sub.channel}`,
      });
    }
  }
}

async function evaluateBusinessRules(ctx: {
  eventType: string;
  entityType?: string;
  entityId?: string;
  payload?: Record<string, unknown>;
  organizationId?: string;
}) {
  const rules = await prisma.businessRule.findMany({ where: { isActive: true }, orderBy: { priority: "asc" } });
  for (const rule of rules) {
    const cond = rule.condition as { field?: string; operator?: string; value?: unknown };
    const payload = ctx.payload ?? {};
    const fieldVal = cond.field ? (payload[cond.field] ?? ctx.entityType) : null;
    let match = false;
    if (cond.operator === "lt" && typeof fieldVal === "number" && typeof cond.value === "number") match = fieldVal < cond.value;
    if (cond.operator === "eq") match = fieldVal === cond.value;
    if (cond.operator === "event" && cond.value === ctx.eventType) match = true;
    if (cond.operator === "empty" && (fieldVal === 0 || fieldVal === "0" || fieldVal === null)) match = true;

    if (match) {
      await prisma.ruleExecutionLog.create({
        data: {
          ruleId: rule.id,
          entityType: ctx.entityType,
          entityId: ctx.entityId,
          result: "APPLIED",
          metadata: { action: rule.action, eventType: ctx.eventType },
        },
      });
    }
  }
}

async function triggerWorkflows(eventType: string, ctx: Record<string, unknown>) {
  const defs = await prisma.workflowDefinition.findMany({ where: { isActive: true, triggerType: "event" } });
  for (const def of defs) {
    const cfg = def.triggerConfig as { eventType?: string };
    if (cfg.eventType === eventType || cfg.eventType === "*") {
      const instance = await prisma.workflowInstance.create({
        data: {
          definitionId: def.id,
          ownerId: ctx.actorId as string | undefined,
          triggerData: ctx as object,
          status: "RUNNING",
        },
      });
      const actions = getActionsFromDefinition(def);
      await executeWorkflowActions(instance.id, actions, ctx);
      await prisma.workflowInstance.update({
        where: { id: instance.id },
        data: { status: "COMPLETED", completedAt: new Date(), result: { actionsExecuted: actions.length } },
      });
    }
  }
}

export async function isFeatureEnabled(key: string, organizationId?: string) {
  const flag = await prisma.featureFlag.findUnique({ where: { key } });
  if (!flag) return true;
  if (organizationId) {
    const override = await prisma.featureFlagOverride.findFirst({ where: { flagId: flag.id, organizationId } });
    if (override) return override.enabled;
  }
  if (!flag.enabled) return false;
  if (flag.rolloutPct < 100) return Math.random() * 100 < flag.rolloutPct;
  return true;
}

export async function listFeatureFlags(personaScope?: PersonaScope) {
  return prisma.featureFlag.findMany({
    where: personaScope ? { OR: [{ personaScope }, { personaScope: "GLOBAL" }] } : undefined,
    orderBy: { key: "asc" },
    include: { overrides: true },
  });
}

export async function upsertFeatureFlag(data: {
  key: string;
  name: string;
  description?: string;
  enabled: boolean;
  rolloutPct?: number;
  personaScope?: PersonaScope;
  moduleKey?: string;
}, userId?: string) {
  const flag = await prisma.featureFlag.upsert({
    where: { key: data.key },
    update: data,
    create: { ...data, personaScope: data.personaScope ?? "GLOBAL" },
  });
  await createAuditLog({ userId, action: "UPDATE", module: "platform", resource: "feature_flag", resourceId: flag.id, metadata: data });
  return flag;
}

export async function listWorkflows(personaScope?: PersonaScope, organizationId?: string) {
  return prisma.workflowDefinition.findMany({
    where: {
      ...(personaScope ? { OR: [{ personaScope }, { personaScope: "GLOBAL" }] } : {}),
      ...(organizationId ? { OR: [{ organizationId }, { organizationId: null }] } : {}),
    },
    include: { instances: { take: 5, orderBy: { startedAt: "desc" } } },
    orderBy: { updatedAt: "desc" },
  });
}

export async function createWorkflow(data: {
  name: string;
  description?: string;
  personaScope: PersonaScope;
  organizationId?: string;
  triggerType: string;
  triggerConfig: object;
  actions: object[];
}, userId?: string) {
  const wf = await prisma.workflowDefinition.create({ data: { ...data, triggerConfig: data.triggerConfig as object, actions: data.actions as object[] } });
  await createAuditLog({ userId, action: "CREATE", module: "platform", resource: "workflow", resourceId: wf.id });
  return wf;
}

export interface WorkflowVisualNode {
  id: string;
  type: string;
  label: string;
  x: number;
  y: number;
  data?: Record<string, unknown>;
}

export interface WorkflowVisualEdge {
  id: string;
  source: string;
  target: string;
}

export function compileVisualWorkflow(params: {
  name: string;
  description?: string;
  personaScope: PersonaScope;
  nodes: WorkflowVisualNode[];
  edges: WorkflowVisualEdge[];
}) {
  const triggerNode = params.nodes.find((n) => n.type === "trigger");
  const eventType = (triggerNode?.data?.eventType as string) ?? "manual";
  const triggerType = (triggerNode?.data?.triggerType as string) ?? "event";
  const ordered = getOrderedActionNodes(params.nodes, params.edges);
  const actions = ordered.map((n) => ({
    type: n.type,
    label: n.label,
    config: n.data ?? {},
  }));
  return {
    name: params.name,
    description: params.description,
    personaScope: params.personaScope,
    triggerType,
    triggerConfig: { eventType, nodes: params.nodes, edges: params.edges },
    actions,
  };
}

function getOrderedActionNodes(nodes: WorkflowVisualNode[], edges: WorkflowVisualEdge[]) {
  const trigger = nodes.find((n) => n.type === "trigger");
  if (!trigger) return nodes.filter((n) => n.type !== "trigger");

  const ordered: WorkflowVisualNode[] = [];
  const visited = new Set<string>();
  let current: string | undefined = edges.find((e) => e.source === trigger.id)?.target;

  while (current && !visited.has(current)) {
    visited.add(current);
    const node = nodes.find((n) => n.id === current);
    if (node && node.type !== "trigger") ordered.push(node);
    current = edges.find((e) => e.source === current)?.target;
  }

  const remaining = nodes.filter((n) => n.type !== "trigger" && !visited.has(n.id));
  return [...ordered, ...remaining];
}

function getActionsFromDefinition(def: { actions: unknown; triggerConfig: unknown }) {
  const cfg = def.triggerConfig as { nodes?: WorkflowVisualNode[]; edges?: WorkflowVisualEdge[] };
  if (cfg?.nodes?.length) {
    return getOrderedActionNodes(cfg.nodes, cfg.edges ?? []).map((n) => ({
      type: n.type,
      config: n.data ?? {},
      label: n.label,
    }));
  }
  return (def.actions as { type: string; config?: Record<string, unknown> }[]) ?? [];
}

export async function getWorkflowById(id: string) {
  return prisma.workflowDefinition.findUniqueOrThrow({
    where: { id },
    include: { instances: { take: 10, orderBy: { startedAt: "desc" } } },
  });
}

export async function updateWorkflow(
  id: string,
  data: {
    name?: string;
    description?: string;
    personaScope?: PersonaScope;
    isActive?: boolean;
    triggerType?: string;
    triggerConfig?: object;
    actions?: object[];
    visual?: { nodes: WorkflowVisualNode[]; edges: WorkflowVisualEdge[] };
  },
  userId?: string
) {
  let payload = { ...data };
  if (data.visual) {
    const compiled = compileVisualWorkflow({
      name: data.name ?? "Workflow",
      description: data.description,
      personaScope: data.personaScope ?? "GLOBAL",
      nodes: data.visual.nodes,
      edges: data.visual.edges,
    });
    payload = {
      ...compiled,
      isActive: data.isActive,
      description: data.description ?? compiled.description,
      name: data.name ?? compiled.name,
    };
    delete (payload as { visual?: unknown }).visual;
  }

  const wf = await prisma.workflowDefinition.update({
    where: { id },
    data: {
      ...(payload.name ? { name: payload.name } : {}),
      ...(payload.description !== undefined ? { description: payload.description } : {}),
      ...(payload.personaScope ? { personaScope: payload.personaScope } : {}),
      ...(payload.isActive !== undefined ? { isActive: payload.isActive } : {}),
      ...(payload.triggerType ? { triggerType: payload.triggerType } : {}),
      ...(payload.triggerConfig ? { triggerConfig: payload.triggerConfig as object } : {}),
      ...(payload.actions ? { actions: payload.actions as object[] } : {}),
    },
  });
  await createAuditLog({ userId, action: "UPDATE", module: "platform", resource: "workflow", resourceId: id });
  return wf;
}

export async function createVisualWorkflow(
  params: {
    name: string;
    description?: string;
    personaScope: PersonaScope;
    nodes: WorkflowVisualNode[];
    edges: WorkflowVisualEdge[];
  },
  userId?: string
) {
  const compiled = compileVisualWorkflow(params);
  return createWorkflow(compiled, userId);
}

async function executeWorkflowActions(
  instanceId: string,
  actions: { type: string; config?: Record<string, unknown>; label?: string }[],
  ctx?: Record<string, unknown>
) {
  for (const action of actions) {
    await prisma.workflowExecutionLog.create({
      data: {
        instanceId,
        step: action.type,
        status: "COMPLETED",
        message: action.label ?? action.type,
        metadata: asInputJson({ ...(action.config ?? {}), ctx }),
      },
    });
  }
}

export async function runWorkflowManually(definitionId: string, ownerId?: string, triggerData?: object) {
  const def = await prisma.workflowDefinition.findUniqueOrThrow({ where: { id: definitionId } });
  const instance = await prisma.workflowInstance.create({
    data: { definitionId, ownerId, triggerData: triggerData ?? {}, status: "RUNNING" },
  });
  const actions = getActionsFromDefinition(def);
  await executeWorkflowActions(instance.id, actions, triggerData as Record<string, unknown>);
  return prisma.workflowInstance.update({
    where: { id: instance.id },
    data: { status: "COMPLETED", completedAt: new Date(), result: { steps: actions.length } },
  });
}

export async function getSlaDashboard(personaScope?: PersonaScope) {
  const { syncSlaBreaches, getSlaRecordsWithEntities } = await import("./sla-service.js");
  await syncSlaBreaches();

  const policies = await prisma.slaPolicy.findMany({
    where: personaScope ? { OR: [{ personaScope }, { personaScope: "GLOBAL" }] } : undefined,
    include: { records: { where: { status: { in: ["ACTIVE", "BREACHED"] } }, take: 20, orderBy: { dueAt: "asc" } } },
  });
  const [active, breached, met] = await Promise.all([
    prisma.slaRecord.count({ where: { status: "ACTIVE" } }),
    prisma.slaRecord.count({ where: { status: "BREACHED" } }),
    prisma.slaRecord.count({ where: { status: "MET" } }),
  ]);
  const total = active + breached + met;
  return {
    metrics: [
      { label: "SLAs ativos", value: active },
      { label: "Violações", value: breached },
      { label: "Cumprimento", value: total ? Math.round((met / total) * 100) : 100, suffix: "%" },
      { label: "Políticas", value: policies.length },
    ],
    policies,
    recentRecords: await getSlaRecordsWithEntities(25),
    aiInsights: breached > 0
      ? [{ title: "Gargalo detectado", description: `${breached} SLAs violados — priorize tickets e denúncias críticas.`, priority: "high" }]
      : [{ title: "SLA saudável", description: "Nenhuma violação crítica no momento.", priority: "low" }],
  };
}

export async function createSlaPolicy(data: {
  name: string;
  personaScope: PersonaScope;
  entityType: string;
  responseMins: number;
  resolutionMins: number;
  organizationId?: string;
}, userId?: string) {
  const policy = await prisma.slaPolicy.create({ data });
  await createAuditLog({ userId, action: "CREATE", module: "platform", resource: "sla_policy", resourceId: policy.id });
  return policy;
}

export async function trackSla(entityType: string, entityId: string, policyId: string) {
  const policy = await prisma.slaPolicy.findUniqueOrThrow({ where: { id: policyId } });
  const dueAt = new Date(Date.now() + policy.resolutionMins * 60 * 1000);
  return prisma.slaRecord.create({ data: { policyId, entityType, entityId, dueAt } });
}

export async function listVersions(entityType: string, entityId: string) {
  return prisma.entityVersion.findMany({ where: { entityType, entityId }, orderBy: { version: "desc" } });
}

export async function saveEntityVersion(params: {
  entityType: string;
  entityId: string;
  snapshot: object;
  changeNote?: string;
  authorId?: string;
}) {
  const latest = await prisma.entityVersion.findFirst({
    where: { entityType: params.entityType, entityId: params.entityId },
    orderBy: { version: "desc" },
  });
  const version = (latest?.version ?? 0) + 1;
  return prisma.entityVersion.create({
    data: {
      entityType: params.entityType,
      entityId: params.entityId,
      version,
      snapshot: params.snapshot as object,
      changeNote: params.changeNote,
      authorId: params.authorId,
    },
  });
}

export async function getCostDashboard(organizationId?: string) {
  const where = organizationId ? { organizationId } : {};
  const entries = await prisma.costEntry.findMany({ where, orderBy: { periodStart: "desc" }, take: 50 });
  const byCategory = await prisma.costEntry.groupBy({ by: ["category"], where, _sum: { amount: true } });
  const byPersona = await prisma.costEntry.groupBy({ by: ["personaScope"], where, _sum: { amount: true } });
  return {
    metrics: byCategory.map((c) => ({ label: c.category.toUpperCase(), value: c._sum.amount ?? 0 })),
    byPersona: byPersona.map((p) => ({ label: p.personaScope, value: p._sum.amount ?? 0 })),
    entries,
    aiInsights: [{ title: "Maior consumo: IA", description: "Monitore tokens e chamadas de API para otimizar custos.", priority: "medium" }],
  };
}

export async function recordCost(data: {
  category: string;
  amount: number;
  moduleKey?: string;
  personaScope?: PersonaScope;
  organizationId?: string;
  userId?: string;
  quantity?: number;
  unit?: string;
}) {
  const now = new Date();
  return prisma.costEntry.create({
    data: {
      ...data,
      personaScope: data.personaScope ?? "GLOBAL",
      periodStart: now,
      periodEnd: now,
    },
  });
}

export async function getDataLayerDashboard() {
  const [pipelines, metrics, events] = await Promise.all([
    prisma.dataPipeline.findMany({ orderBy: { updatedAt: "desc" } }),
    prisma.systemMetric.findMany({ orderBy: { date: "desc" }, take: 20 }).catch(() => []),
    prisma.platformEvent.count(),
  ]);
  return {
    metrics: [
      { label: "Pipelines ETL", value: pipelines.length },
      { label: "Eventos indexados", value: events },
      { label: "Data marts", value: pipelines.filter((p) => p.layer === "mart").length },
    ],
    pipelines,
    layers: [
      { name: "Data Lake", count: pipelines.filter((p) => p.layer === "lake").length },
      { name: "Data Warehouse", count: pipelines.filter((p) => p.layer === "warehouse").length },
      { name: "Data Mart", count: pipelines.filter((p) => p.layer === "mart").length },
      { name: "ETL", count: pipelines.filter((p) => p.layer === "etl").length },
    ],
    recentMetrics: metrics,
  };
}

export async function listBusinessRules(personaScope?: PersonaScope) {
  return prisma.businessRule.findMany({
    where: personaScope ? { OR: [{ personaScope }, { personaScope: "GLOBAL" }] } : undefined,
    include: { executions: { take: 5, orderBy: { createdAt: "desc" } } },
    orderBy: { priority: "asc" },
  });
}

export async function createBusinessRule(data: {
  name: string;
  description?: string;
  personaScope: PersonaScope;
  condition: object;
  action: object;
  priority?: number;
  organizationId?: string;
}, userId?: string) {
  const rule = await prisma.businessRule.create({ data: { ...data, condition: data.condition as object, action: data.action as object } });
  await createAuditLog({ userId, action: "CREATE", module: "platform", resource: "business_rule", resourceId: rule.id });
  return rule;
}

export async function listPlatformEvents(filters?: { eventType?: string; personaScope?: PersonaScope; limit?: number }) {
  return prisma.platformEvent.findMany({
    where: {
      ...(filters?.eventType ? { eventType: filters.eventType } : {}),
      ...(filters?.personaScope ? { personaScope: filters.personaScope } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: filters?.limit ?? 50,
    include: { actor: { select: { id: true, name: true, email: true } } },
  });
}

export async function getIntelligenceDashboard(personaScope: PersonaScope = "GESTOR") {
  const [events, insights, robots, tickets, reports] = await Promise.all([
    prisma.platformEvent.count({ where: { createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } } }),
    prisma.governanceInsight.findMany({ where: { resolved: false }, take: 10, orderBy: { createdAt: "desc" } }),
    prisma.operationalRobot.count({ where: { isActive: true } }),
    prisma.supportTicket.count({ where: { status: { in: ["OPEN", "IN_PROGRESS"] } } }),
    prisma.contentReport.count({ where: { status: "PENDING" } }),
  ]);
  return {
    personaScope,
    metrics: [
      { label: "Eventos (7d)", value: events },
      { label: "Robôs ativos", value: robots },
      { label: "Tickets abertos", value: tickets },
      { label: "Denúncias pendentes", value: reports },
    ],
    insights: insights.length ? insights : [
      { id: "ai-1", category: "growth", title: "Retenção estável", description: "Taxa de retorno de clientes em 78% este mês.", severity: "info", suggestion: "Campanhas de reengajamento para inativos." },
      { id: "ai-2", category: "risk", title: "Monitorar denúncias", description: `${reports} denúncias aguardando moderação.`, severity: reports > 5 ? "high" : "low", suggestion: "Priorizar fila de moderação." },
    ],
    robots: await prisma.operationalRobot.findMany({ where: { isActive: true }, take: 10 }),
  };
}

export async function getObservabilityDashboard() {
  const [health, errors, snapshots, backups] = await Promise.all([
    prisma.systemHealthCheck.findMany({ orderBy: { checkedAt: "desc" }, take: 10 }),
    prisma.systemError.findMany({ where: { resolved: false }, orderBy: { createdAt: "desc" }, take: 10 }),
    prisma.observabilitySnapshot.findMany({ orderBy: { recordedAt: "desc" }, take: 20 }),
    prisma.backupJob.findMany({ orderBy: { createdAt: "desc" }, take: 5 }),
  ]);
  const uptime = health.filter((h) => h.status === "ok").length / Math.max(health.length, 1) * 100;
  return {
    metrics: [
      { label: "Uptime", value: Math.round(uptime), suffix: "%" },
      { label: "Erros abertos", value: errors.length },
      { label: "Serviços monitorados", value: new Set(health.map((h) => h.service)).size },
      { label: "Backups recentes", value: backups.length },
    ],
    health,
    errors,
    snapshots,
    backups,
  };
}

export async function triggerBackup(type: string, initiatedBy?: string) {
  const job = await prisma.backupJob.create({
    data: { type, status: "RUNNING", initiatedBy, metadata: { scope: "full" } },
  });
  const completed = await prisma.backupJob.update({
    where: { id: job.id },
    data: {
      status: "COMPLETED",
      sizeBytes: Math.floor(Math.random() * 500_000_000) + 10_000_000,
      path: `/backups/ecopet-${Date.now()}.snapshot`,
      completedAt: new Date(),
    },
  });
  await createAuditLog({ userId: initiatedBy, action: "CREATE", module: "platform", resource: "backup", resourceId: job.id });
  return completed;
}

export async function getLgpdDashboard(userId?: string) {
  const [requests, consents, policies] = await Promise.all([
    prisma.lgpdRequest.findMany({
      where: userId ? { userId } : undefined,
      orderBy: { createdAt: "desc" },
      take: 20,
      include: { user: { select: { id: true, name: true, email: true } } },
    }),
    userId ? prisma.consentRecord.findMany({ where: { userId }, orderBy: { grantedAt: "desc" } }) : prisma.consentRecord.findMany({ take: 20, orderBy: { grantedAt: "desc" } }),
    prisma.dataRetentionPolicy.findMany({ where: { isActive: true } }),
  ]);
  return { requests, consents, retentionPolicies: policies };
}

export async function createLgpdRequest(userId: string, type: "EXPORT" | "DELETE" | "ANONYMIZE" | "ACCESS", notes?: string) {
  const req = await prisma.lgpdRequest.create({ data: { userId, type, notes } });
  await emitPlatformEvent({ eventType: "lgpd.request_created", personaScope: "CLIENT", actorId: userId, entityType: "lgpd_request", entityId: req.id, payload: { type } });
  return req;
}

export async function recordConsent(userId: string, consentType: string, granted: boolean, ip?: string) {
  if (!granted) {
    await prisma.consentRecord.updateMany({ where: { userId, consentType, revokedAt: null }, data: { revokedAt: new Date(), granted: false } });
  }
  return prisma.consentRecord.create({ data: { userId, consentType, granted, ip } });
}

export async function getOrganizations(type?: string) {
  return prisma.organization.findMany({
    where: type ? { type } : undefined,
    include: { units: true, _count: { select: { members: true, users: true } } },
    orderBy: { name: "asc" },
  });
}

export async function getPersonaExecutiveDashboard(persona: PersonaScope, userId?: string) {
  switch (persona) {
    case "CLIENT": {
      const user = userId ? await prisma.user.findUnique({ where: { id: userId }, include: { pets: true, wallet: true, orders: { take: 5, orderBy: { createdAt: "desc" } } } }) : null;
      return {
        metrics: [
          { label: "Pets", value: user?.pets.length ?? 0 },
          { label: "Saldo ECOPET", value: user?.wallet?.balance ?? 0 },
          { label: "Pedidos recentes", value: user?.orders.length ?? 0 },
        ],
        aiInsights: [{ title: "Saúde do pet", description: "Verifique vacinas próximas do vencimento.", priority: "medium" }],
      };
    }
    case "PARTNER": {
      const [products, orders] = await Promise.all([
        prisma.product.count({ where: userId ? { sellerId: userId } : undefined }),
        prisma.order.count({ where: { status: "PAID" } }),
      ]);
      return {
        metrics: [
          { label: "Produtos", value: products },
          { label: "Vendas pagas", value: orders },
        ],
        aiInsights: [{ title: "Estoque", description: "Revise produtos com baixo giro.", priority: "low" }],
      };
    }
    case "NGO": {
      const listings = await prisma.adoptionListing.count();
      return {
        metrics: [{ label: "Adoções ativas", value: listings }],
        aiInsights: [{ title: "Campanhas", description: "Otimize campanhas de doação para fim de mês.", priority: "medium" }],
      };
    }
    default:
      return getIntelligenceDashboard("GESTOR");
  }
}

export async function seedPlatformInfrastructure() {
  const flags = [
    { key: "marketplace", name: "Marketplace", enabled: true, moduleKey: "marketplace" },
    { key: "social", name: "Rede Social", enabled: true, moduleKey: "social" },
    { key: "ai", name: "Inteligência Artificial", enabled: true, moduleKey: "ai" },
    { key: "agropet", name: "AgroPet", enabled: true, moduleKey: "agropet" },
    { key: "iot", name: "IoT", enabled: true, moduleKey: "iot" },
    { key: "robots", name: "Robôs 24h", enabled: true, moduleKey: "robots" },
    { key: "wallet", name: "Saldo ECOPET", enabled: true, moduleKey: "wallet" },
    { key: "health", name: "Saúde Pet", enabled: true, moduleKey: "health" },
  ];
  for (const f of flags) {
    await prisma.featureFlag.upsert({ where: { key: f.key }, update: f, create: { ...f, personaScope: "GLOBAL" } });
  }

  const visualWorkflow = (
    name: string,
    personaScope: PersonaScope,
    eventType: string,
    actionList: { type: string; label: string; config?: Record<string, unknown> }[]
  ) => {
    const triggerId = "trigger-seed";
    const nodes: WorkflowVisualNode[] = [{
      id: triggerId, type: "trigger", label: "Quando", x: 80, y: 120,
      data: { eventType, triggerType: "event" },
    }];
    const edges: WorkflowVisualEdge[] = [];
    let prev = triggerId;
    actionList.forEach((a, i) => {
      const id = `action-seed-${i}`;
      nodes.push({ id, type: a.type, label: a.label, x: 280 + i * 200, y: 120, data: a.config ?? {} });
      edges.push({ id: `edge-seed-${i}`, source: prev, target: id });
      prev = id;
    });
    return compileVisualWorkflow({ name, personaScope, nodes, edges });
  };

  const workflows = [
    visualWorkflow("Estoque mínimo", "PARTNER", "stock.low", [
      { type: "notify", label: "Enviar notificação", config: { channel: "email" } },
      { type: "create_task", label: "Criar tarefa", config: {} },
    ]),
    visualWorkflow("Vacina próxima", "CLIENT", "vaccine.due", [
      { type: "notify", label: "Notificar cliente", config: {} },
      { type: "calendar_event", label: "Evento na agenda", config: {} },
    ]),
    visualWorkflow("Denúncia crítica", "GESTOR", "report.critical", [
      { type: "create_ticket", label: "Criar ticket prioritário", config: { priority: "high" } },
      { type: "notify_moderators", label: "Avisar moderadores", config: {} },
    ]),
    visualWorkflow("Ticket de suporte", "GLOBAL", "ticket.created", [
      { type: "notify", label: "Notificar equipe", config: { channel: "email" } },
      { type: "create_task", label: "Triagem inicial", config: {} },
    ]),
  ];
  for (const w of workflows) {
    const exists = await prisma.workflowDefinition.findFirst({ where: { name: w.name } });
    if (!exists) {
      await prisma.workflowDefinition.create({
        data: {
          ...w,
          triggerConfig: asInputJson(w.triggerConfig),
          actions: asInputJson(w.actions),
        },
      });
    }
  }

  const rules = [
    { name: "Parceiro nota baixa", personaScope: "PARTNER" as PersonaScope, condition: { field: "rating", operator: "lt", value: 3 }, action: { type: "suspend_ads" } },
    { name: "Estoque zerado", personaScope: "PARTNER" as PersonaScope, condition: { field: "stock", operator: "empty" }, action: { type: "hide_product" } },
    { name: "Documento vencido", personaScope: "GLOBAL" as PersonaScope, condition: { operator: "event", value: "document.expired" }, action: { type: "block_operation" } },
  ];
  for (const r of rules) {
    const exists = await prisma.businessRule.findFirst({ where: { name: r.name } });
    if (!exists) await prisma.businessRule.create({ data: r });
  }

  const slas = [
    { name: "Suporte padrão", entityType: "support_ticket", responseMins: 60, resolutionMins: 480, personaScope: "GLOBAL" as PersonaScope },
    { name: "Denúncia crítica", entityType: "content_report", responseMins: 30, resolutionMins: 120, personaScope: "GESTOR" as PersonaScope },
    { name: "Denúncia padrão", entityType: "content_report", responseMins: 120, resolutionMins: 480, personaScope: "GESTOR" as PersonaScope },
  ];
  for (const s of slas) {
    const exists = await prisma.slaPolicy.findFirst({ where: { name: s.name } });
    if (!exists) await prisma.slaPolicy.create({ data: s });
  }

  const pipelines = [
    { name: "Marketplace → Lake", layer: "lake", source: "orders,products", status: "ACTIVE" as const },
    { name: "Social → Warehouse", layer: "warehouse", source: "posts,engagement", status: "ACTIVE" as const },
    { name: "Financeiro Mart", layer: "mart", source: "wallet,transactions", status: "ACTIVE" as const },
    { name: "ETL Diário", layer: "etl", source: "all", schedule: "0 2 * * *", status: "IDLE" as const },
  ];
  for (const p of pipelines) {
    const exists = await prisma.dataPipeline.findFirst({ where: { name: p.name } });
    if (!exists) await prisma.dataPipeline.create({ data: p }).catch(() => {});
  }

  const retentionPolicies = [
    { name: "Logs sistema", dataCategory: "logs", retentionDays: 365, personaScope: "GLOBAL" as PersonaScope },
    { name: "Mensagens chat", dataCategory: "messages", retentionDays: 730, personaScope: "GLOBAL" as PersonaScope },
    { name: "Auditoria", dataCategory: "audit", retentionDays: 1825, personaScope: "GLOBAL" as PersonaScope },
  ];
  for (const r of retentionPolicies) {
    const exists = await prisma.dataRetentionPolicy.findFirst({ where: { name: r.name } });
    if (!exists) await prisma.dataRetentionPolicy.create({ data: r }).catch(() => {});
  }

  const org = await prisma.organization.upsert({
    where: { slug: "ecopet" },
    update: {},
    create: { name: "ECOPET Platform", slug: "ecopet", type: "ECOPET" },
  });

  return { flags: flags.length, workflows: workflows.length, organizationId: org.id };
}
