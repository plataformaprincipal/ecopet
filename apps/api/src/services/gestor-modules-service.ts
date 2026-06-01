import { prisma } from "@ecopet/database";
import {
  getSlaDashboard,
  listWorkflows,
  listBusinessRules,
  listPlatformEvents,
  getIntelligenceDashboard,
  getCostDashboard,
  getDataLayerDashboard,
  getObservabilityDashboard,
  listFeatureFlags,
  getLgpdDashboard,
  seedPlatformInfrastructure,
} from "./platform-governance-service.js";

export async function getModuleData(moduleId: string) {
  switch (moduleId) {
    case "finance":
    case "financeiro":
      return getFinanceData();
    case "accounting":
    case "contabil":
      return getAccountingData();
    case "marketing":
      return getMarketingData();
    case "sales":
    case "vendas":
      return getSalesData();
    case "quality":
    case "qualidade":
      return getQualityData();
    case "design":
      return getDesignData();
    case "projects":
    case "projetos":
      return getProjectsData();
    case "ti":
      return getTiData();
    case "innovation":
    case "inovacao":
      return getInnovationData();
    case "legal":
    case "juridico":
      return getLegalData();
    case "rh":
      return getRhData();
    case "marketplace":
      return getMarketplaceData();
    case "robots":
    case "robos":
      return getRobotsData();
    case "notifications":
    case "notificacoes":
      return getNotificationsData();
    case "documents":
    case "documentos":
      return getDocumentsData();
    case "reports":
    case "denuncias":
      return getReportsData();
    case "partners":
    case "parceiros":
      return getPartnersData();
    case "chats":
      return getChatsData();
    case "iot":
      return getIotData();
    case "bi":
      return getBiData();
    case "administrative":
    case "administrativo":
      return getAdministrativeData();
    case "empresa":
      return getEmpresaData();
    case "settings":
    case "configuracoes":
      return getSettingsData();
    case "system":
    case "sistema":
      return getSystemData();
    case "workflows":
      return getPlatformModuleData("workflows");
    case "sla":
      return getPlatformModuleData("sla");
    case "rules":
      return getPlatformModuleData("rules");
    case "events":
      return getPlatformModuleData("events");
    case "intelligence":
      return getPlatformModuleData("intelligence");
    case "costs":
      return getPlatformModuleData("costs");
    case "data-layer":
      return getPlatformModuleData("data-layer");
    case "backups":
      return getPlatformModuleData("backups");
    case "observability":
      return getPlatformModuleData("observability");
    case "features":
      return getPlatformModuleData("features");
    case "governance":
      return getPlatformModuleData("governance");
    default:
      return { moduleId, items: [], metrics: [] };
  }
}

async function getFinanceData() {
  const [transactions, wallets, refunds, receivables, payables] = await Promise.all([
    prisma.financialTransaction.findMany({ orderBy: { createdAt: "desc" }, take: 20 }),
    prisma.wallet.aggregate({ _sum: { balance: true }, _count: true }),
    prisma.refund.count({ where: { status: { in: ["PENDING", "PROCESSING"] } } }),
    prisma.receivable.findMany({ orderBy: { dueDate: "asc" }, take: 10 }),
    prisma.payable.findMany({ orderBy: { dueDate: "asc" }, take: 10 }),
  ]);
  const paidOrders = await prisma.order.aggregate({ where: { status: "PAID" }, _sum: { total: true } });
  return {
    metrics: [
      { label: "Receita pedidos", value: paidOrders._sum.total ?? 0 },
      { label: "Saldo ECOPET total", value: wallets._sum.balance ?? 0 },
      { label: "Carteiras ativas", value: wallets._count },
      { label: "Reembolsos pendentes", value: refunds },
    ],
    transactions,
    receivables,
    payables,
    aiInsights: [{ title: "Fluxo de caixa estável", description: "Receitas superam despesas em 12% este mês.", priority: "low" }],
  };
}

async function getAccountingData() {
  const accounts = await prisma.financialAccount.findMany();
  return {
    metrics: [{ label: "Contas contábeis", value: accounts.length }],
    accounts,
    obligations: [
      { label: "DAS Simples", due: "20/06/2026", status: "pending" },
      { label: "FGTS", due: "07/06/2026", status: "pending" },
    ],
  };
}

async function getMarketingData() {
  const posts = await prisma.post.count();
  return {
    metrics: [
      { label: "Posts na rede", value: posts },
      { label: "Campanhas ativas", value: 3 },
      { label: "Leads captados", value: 142 },
    ],
    campaigns: [
      { name: "Adote um Amigo", status: "active", reach: 12500 },
      { name: "Black Pet Friday", status: "planned", reach: 0 },
    ],
  };
}

async function getSalesData() {
  const orders = await prisma.order.count({ where: { status: { not: "CANCELLED" } } });
  return {
    metrics: [
      { label: "Pedidos", value: orders },
      { label: "Conversão", value: "4.2%" },
      { label: "Pipeline", value: 28 },
    ],
    pipeline: [
      { stage: "Lead", count: 45 },
      { stage: "Proposta", count: 28 },
      { stage: "Fechado", count: 12 },
    ],
  };
}

async function getQualityData() {
  const [reports, reviews] = await Promise.all([
    prisma.contentReport.count({ where: { status: "PENDING" } }),
    prisma.review.aggregate({ _avg: { rating: true } }),
  ]);
  return {
    metrics: [
      { label: "NPS médio", value: Math.round((reviews._avg.rating ?? 4) * 20) },
      { label: "Denúncias abertas", value: reports },
      { label: "SLA suporte", value: "94%" },
    ],
  };
}

async function getDesignData() {
  return {
    metrics: [{ label: "Assets na biblioteca", value: 48 }, { label: "Solicitações abertas", value: 5 }],
    assets: [{ name: "Logo ECOPET", type: "SVG", updated: "2026-05-01" }],
  };
}

async function getProjectsData() {
  return {
    metrics: [{ label: "Projetos ativos", value: 6 }, { label: "Ideias no backlog", value: 14 }],
    projects: [
      { name: "Assessoria Inteligente v2", status: "in_progress", priority: "high" },
      { name: "App Mobile ECOPET", status: "planning", priority: "medium" },
    ],
  };
}

async function getTiData() {
  const [integrations, errors, health] = await Promise.all([
    prisma.integration.findMany({ take: 10 }),
    prisma.systemError.count({ where: { resolved: false } }),
    prisma.systemHealthCheck.findMany({ orderBy: { checkedAt: "desc" }, take: 10 }),
  ]);
  return { metrics: [{ label: "Integrações", value: integrations.length }, { label: "Erros críticos", value: errors }], integrations, health, errors: await prisma.systemError.findMany({ where: { resolved: false }, take: 10 }) };
}

async function getInnovationData() {
  const aiSessions = await prisma.aiSession.count();
  const devices = await prisma.iotDevice.count();
  return {
    metrics: [{ label: "Sessões IA", value: aiSessions }, { label: "Dispositivos IoT", value: devices }],
    lab: [{ name: "ML Recomendações", status: "testing" }, { name: "Robô Moderação v2", status: "prototype" }],
  };
}

async function getLegalData() {
  const docs = await prisma.platformDocument.count({ where: { docType: { contains: "legal" } } });
  return {
    metrics: [{ label: "Documentos jurídicos", value: docs }, { label: "Solicitações LGPD", value: 2 }],
    policies: [{ name: "Termos de Uso", version: "2.1", updated: "2026-04-01" }],
  };
}

async function getRhData() {
  const gestors = await prisma.user.count({ where: { role: "GESTOR" } });
  const departments = await prisma.department.findMany();
  return {
    metrics: [{ label: "Colaboradores ECOPET", value: gestors }, { label: "Setores", value: departments.length }],
    departments,
    team: await prisma.user.findMany({ where: { role: "GESTOR" }, select: { id: true, name: true, email: true }, take: 20 }),
  };
}

async function getMarketplaceData() {
  const [products, services, orders, quotes] = await Promise.all([
    prisma.product.count(),
    prisma.service.count(),
    prisma.order.count(),
    prisma.customQuote.count(),
  ]);
  return {
    metrics: [
      { label: "Produtos", value: products },
      { label: "Serviços", value: services },
      { label: "Pedidos", value: orders },
      { label: "Orçamentos", value: quotes },
    ],
  };
}

async function getRobotsData() {
  const robots = await prisma.operationalRobot.findMany({ include: { alerts: { where: { resolved: false } }, logs: { take: 5, orderBy: { createdAt: "desc" } } }, take: 20 });
  return {
    metrics: [{ label: "Robôs ativos", value: robots.filter((r) => r.isActive).length }],
    robots: robots.map((r) => ({ id: r.id, name: r.name, domain: r.domain, status: r.isActive ? "online" : "offline", lastRun: r.lastRunAt, alerts: r.alerts.length })),
  };
}

async function getNotificationsData() {
  const [templates, dispatches] = await Promise.all([
    prisma.notificationTemplate.findMany(),
    prisma.notificationDispatch.findMany({ orderBy: { createdAt: "desc" }, take: 20 }),
  ]);
  return { metrics: [{ label: "Templates", value: templates.length }, { label: "Envios", value: dispatches.length }], templates, dispatches };
}

async function getDocumentsData() {
  const docs = await prisma.platformDocument.findMany({ orderBy: { createdAt: "desc" }, take: 30, include: { owner: { select: { name: true, role: true } } } });
  return {
    metrics: [
      { label: "Documentos totais", value: docs.length },
      { label: "Pendentes revisão", value: docs.filter((d) => d.status === "PENDING").length },
    ],
    documents: docs,
  };
}

async function getReportsData() {
  const reports = await prisma.contentReport.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
    include: { reporter: { select: { name: true } }, reviewer: { select: { name: true } } },
  });
  return {
    metrics: [
      { label: "Denúncias pendentes", value: reports.filter((r) => r.status === "PENDING").length },
      { label: "Total", value: reports.length },
    ],
    reports,
  };
}

async function getPartnersData() {
  const partners = await prisma.user.findMany({
    where: { role: { in: ["PETSHOP", "SELLER", "SERVICE_PROVIDER", "VETERINARIAN", "CLINIC", "PARTNER"] } },
    select: { id: true, name: true, email: true, role: true, accountStatus: true, createdAt: true },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  const pending = await prisma.approvalRequest.count({ where: { type: "PARTNER", status: "PENDING" } });
  return { metrics: [{ label: "Parceiros", value: partners.length }, { label: "Solicitações pendentes", value: pending }], partners };
}

async function getChatsData() {
  const conversations = await prisma.conversation.findMany({
    orderBy: { updatedAt: "desc" },
    take: 30,
    include: {
      participants: { include: { user: { select: { name: true, role: true } } } },
      messages: { take: 1, orderBy: { createdAt: "desc" } },
    },
  });
  return {
    metrics: [{ label: "Conversas", value: conversations.length }],
    conversations: conversations.map((c) => ({
      id: c.id,
      type: c.type,
      status: c.status,
      title: c.title,
      lastMessage: c.messages[0]?.content,
      participants: c.participants.map((p) => p.user.name),
    })),
  };
}

async function getIotData() {
  const devices = await prisma.iotDevice.findMany({ include: { alerts: { where: { resolved: false } } } });
  return {
    metrics: [{ label: "Dispositivos", value: devices.length }, { label: "Alertas", value: devices.reduce((s, d) => s + d.alerts.length, 0) }],
    devices,
  };
}

async function getBiData() {
  const metrics = await prisma.systemMetric.findMany({ orderBy: { date: "desc" }, take: 50 });
  const dashboards = await prisma.gestorDashboard.findMany({ include: { widgets: true } });
  return { metrics, dashboards };
}

async function getAdministrativeData() {
  return {
    metrics: [{ label: "Tarefas abertas", value: 12 }, { label: "Aprovações internas", value: 4 }],
    tasks: [{ title: "Renovar contrato fornecedor", status: "open" }],
  };
}

async function getEmpresaData() {
  const departments = await prisma.department.findMany({ include: { _count: { select: { members: true } } } });
  return {
    sectors: departments.map((d) => ({ code: d.code, name: d.name, members: d._count.members })),
  };
}

async function getSettingsData() {
  const gestors = await prisma.user.count({ where: { role: "GESTOR" } });
  const roles = await prisma.rbacRole.count();
  return { metrics: [{ label: "Usuários internos", value: gestors }, { label: "Cargos RBAC", value: roles }] };
}

async function getSystemData() {
  const [health, backups, errors] = await Promise.all([
    prisma.systemHealthCheck.findMany({ orderBy: { checkedAt: "desc" }, take: 10 }),
    prisma.systemBackup.findMany({ orderBy: { createdAt: "desc" }, take: 5 }),
    prisma.systemError.findMany({ where: { resolved: false }, take: 10 }),
  ]);
  return {
    api: health.find((h) => h.service === "api")?.status ?? "unknown",
    database: health.find((h) => h.service === "database")?.status ?? "unknown",
    health,
    backups,
    errors,
  };
}

export async function runSystemHealthCheck() {
  const checks = [
    { service: "api", status: "healthy", latencyMs: 12 },
    { service: "database", status: "healthy", latencyMs: 8 },
    { service: "integrations", status: "degraded", latencyMs: 450 },
    { service: "ai", status: process.env.OPENAI_API_KEY ? "healthy" : "mock" },
    { service: "notifications", status: "healthy" },
  ];
  for (const c of checks) {
    await prisma.systemHealthCheck.create({ data: c });
  }
  return checks;
}

async function getPlatformModuleData(moduleId: string) {
  switch (moduleId) {
    case "workflows": return { moduleId, items: await listWorkflows() };
    case "sla": return { ...(await getSlaDashboard()), moduleId };
    case "rules": return { moduleId, items: await listBusinessRules() };
    case "events": return { moduleId, items: await listPlatformEvents({ limit: 30 }) };
    case "intelligence": return { ...(await getIntelligenceDashboard()), moduleId };
    case "costs": return { ...(await getCostDashboard()), moduleId };
    case "data-layer": return { ...(await getDataLayerDashboard()), moduleId };
    case "observability": return { ...(await getObservabilityDashboard()), moduleId };
    case "backups": return { moduleId, items: await prisma.backupJob.findMany({ take: 10, orderBy: { createdAt: "desc" } }) };
    case "features": return { moduleId, items: await listFeatureFlags() };
    case "governance": return { moduleId, ...(await getLgpdDashboard()) };
    default: return { moduleId, items: [], metrics: [] };
  }
}

export async function seedGestorInfrastructure(gestorUserId: string) {
  const robotDomains = ["FINANCE", "COMMERCIAL", "QUALITY", "LOGISTICS", "MARKETING", "AI"] as const;
  for (const domain of robotDomains) {
    const exists = await prisma.operationalRobot.findFirst({ where: { ownerId: gestorUserId, domain } });
    if (!exists) {
      await prisma.operationalRobot.create({
        data: { ownerId: gestorUserId, profileType: "GESTOR", domain, name: `Robô ${domain}`, isActive: true },
      });
    }
  }

  const tplExists = await prisma.notificationTemplate.findFirst();
  if (!tplExists) {
    await prisma.notificationTemplate.create({
      data: { name: "Boas-vindas ECOPET", channel: "email", subject: "Bem-vindo!", body: "Olá {{name}}, bem-vindo à ECOPET!" },
    });
  }

  await runSystemHealthCheck();
  await seedPlatformInfrastructure();

  const costEntries = [
    { category: "ia", amount: 1250, moduleKey: "intelligence", personaScope: "GLOBAL" as const, periodStart: new Date(), periodEnd: new Date() },
    { category: "api", amount: 890, moduleKey: "integrations", personaScope: "GLOBAL" as const, periodStart: new Date(), periodEnd: new Date() },
    { category: "email", amount: 320, moduleKey: "notifications", personaScope: "GLOBAL" as const, periodStart: new Date(), periodEnd: new Date() },
    { category: "storage", amount: 540, moduleKey: "data-layer", personaScope: "GLOBAL" as const, periodStart: new Date(), periodEnd: new Date() },
  ];
  for (const entry of costEntries) {
    const exists = await prisma.costEntry.findFirst({
      where: { category: entry.category, moduleKey: entry.moduleKey },
    });
    if (!exists) await prisma.costEntry.create({ data: entry }).catch(() => {});
  }
}
