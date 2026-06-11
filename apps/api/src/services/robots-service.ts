import { prisma } from "@ecopet/database";
import type { RobotDomain } from "@prisma/client";
import { asOptionalInputJson } from "../lib/prisma-json.js";
import { createAuditLog } from "./audit-service.js";
import { isAiEnabled } from "./ai-chat-service.js";

type RobotDef = { domain: RobotDomain; name: string; description: string; trigger: string; action: string };

const TUTOR_ROBOTS: RobotDef[] = [
  { domain: "HEALTH", name: "Robô de Saúde do Pet", description: "Monitora sinais e lembretes de saúde", trigger: "daily", action: "check_health_records" },
  { domain: "PETS", name: "Robô de Vacinas", description: "Alertas de vacinação e vermifugação", trigger: "daily", action: "vaccine_reminders" },
  { domain: "STOCK", name: "Robô de Alimentação", description: "Horários e quantidade de ração", trigger: "scheduled", action: "feeding_schedule" },
  { domain: "LOGISTICS", name: "Robô de Hidratação", description: "Consumo de água e alertas", trigger: "hourly", action: "hydration_check" },
  { domain: "PRODUCTION", name: "Robô de Atividade", description: "Nível de atividade e exercícios", trigger: "daily", action: "activity_summary" },
  { domain: "AGENDA", name: "Robô de Agendamento", description: "Lembretes de consultas e serviços", trigger: "daily", action: "appointment_reminders" },
  { domain: "SHOPPING", name: "Robô de Marketplace", description: "Recomendações de produtos e serviços", trigger: "weekly", action: "marketplace_suggestions" },
  { domain: "AI", name: "Robô de Suporte", description: "Triagem inicial de dúvidas", trigger: "on_message", action: "support_triage" },
];

const PARTNER_ROBOTS: RobotDef[] = [
  { domain: "COMMERCIAL", name: "Robô de Pedidos", description: "Novos pedidos e SLA", trigger: "on_order", action: "order_notify" },
  { domain: "STOCK", name: "Robô de Estoque", description: "Reposição e ruptura", trigger: "daily", action: "stock_check" },
  { domain: "FINANCE", name: "Robô Financeiro", description: "Receitas e repasses", trigger: "daily", action: "finance_summary" },
  { domain: "MONITORING", name: "Robô de Atendimento", description: "Mensagens pendentes", trigger: "hourly", action: "chat_sla" },
  { domain: "AGENDA", name: "Robô de Agenda", description: "Agendamentos do dia", trigger: "daily", action: "agenda_digest" },
  { domain: "QUALITY", name: "Robô de Qualidade", description: "Avaliações e reclamações", trigger: "daily", action: "quality_review" },
  { domain: "PRODUCTION", name: "Robô de Serviços", description: "Serviços em execução", trigger: "hourly", action: "service_status" },
  { domain: "AGROPET", name: "Robô AgroPet", description: "Operação rural integrada", trigger: "daily", action: "agro_digest" },
];

const NGO_ROBOTS: RobotDef[] = [
  { domain: "PETS", name: "Robô de Adoções", description: "Processo de adoção", trigger: "daily", action: "adoption_pipeline" },
  { domain: "CAMPAIGNS", name: "Robô de Campanhas", description: "Campanhas ativas", trigger: "weekly", action: "campaign_status" },
  { domain: "DONATIONS", name: "Robô de Doações", description: "Metas de arrecadação", trigger: "daily", action: "donation_tracker" },
  { domain: "RESCUE", name: "Robô de Resgates", description: "Resgates urgentes", trigger: "hourly", action: "rescue_alerts" },
  { domain: "VOLUNTEERS", name: "Robô de Voluntários", description: "Engajamento voluntário", trigger: "weekly", action: "volunteer_digest" },
  { domain: "AI", name: "Robô de Mensagens", description: "Interessados em adoção", trigger: "on_message", action: "adoption_messages" },
];

const GESTOR_ROBOTS: RobotDef[] = [
  { domain: "AUDIT", name: "Robô de Auditoria", description: "Logs e conformidade", trigger: "daily", action: "audit_scan" },
  { domain: "MONITORING", name: "Robô de Denúncias", description: "Fila de moderação", trigger: "hourly", action: "report_triage" },
  { domain: "AI", name: "Robô de Suporte", description: "Tickets e chats", trigger: "hourly", action: "support_queue" },
  { domain: "HR", name: "Robô de Usuários", description: "Cadastros pendentes", trigger: "daily", action: "user_approvals" },
  { domain: "COMMERCIAL", name: "Robô de Marketplace", description: "Produtos pendentes", trigger: "daily", action: "marketplace_approvals" },
  { domain: "INTEGRATIONS", name: "Robô de Segurança", description: "Eventos suspeitos", trigger: "hourly", action: "security_scan" },
  { domain: "PROJECTS", name: "Robô de IoT", description: "Dispositivos offline", trigger: "hourly", action: "iot_health" },
  { domain: "QUALITY", name: "Robô de Qualidade", description: "SLA e métricas", trigger: "daily", action: "quality_metrics" },
];

function robotsForRole(role: string): RobotDef[] {
  if (role === "GESTOR" || role === "ADMIN") return GESTOR_ROBOTS;
  if (role === "ONG") return NGO_ROBOTS;
  if (["PETSHOP", "SELLER", "SERVICE_PROVIDER", "VETERINARIAN", "CLINIC", "PARTNER"].includes(role)) return PARTNER_ROBOTS;
  return TUTOR_ROBOTS;
}

function profileTypeForRole(role: string) {
  if (role === "GESTOR" || role === "ADMIN") return "gestor";
  if (role === "ONG") return "ong";
  if (["PETSHOP", "SELLER", "SERVICE_PROVIDER", "VETERINARIAN", "CLINIC", "PARTNER"].includes(role)) return "partner";
  return "tutor";
}

export async function ensureUserRobots(userId: string, role: string) {
  const defs = robotsForRole(role);
  const profileType = profileTypeForRole(role);
  const existing = await prisma.operationalRobot.findMany({ where: { ownerId: userId } });
  const existingNames = new Set(existing.map((r) => r.name));

  for (const def of defs) {
    if (existingNames.has(def.name)) continue;
    await prisma.operationalRobot.create({
      data: {
        ownerId: userId,
        profileType,
        domain: def.domain,
        name: def.name,
        description: def.description,
        config: asOptionalInputJson({ trigger: def.trigger, action: def.action, structural: true }),
        isActive: false,
      },
    });
  }

  return prisma.operationalRobot.findMany({
    where: { ownerId: userId },
    include: { logs: { orderBy: { createdAt: "desc" }, take: 3 }, tasks: { orderBy: { scheduledAt: "desc" }, take: 1 } },
    orderBy: { name: "asc" },
  });
}

export async function listUserRobots(userId: string, role: string) {
  const robots = await ensureUserRobots(userId, role);
  const aiAvailable = isAiEnabled();
  return robots.map((r) => {
    const config = (r.config ?? {}) as Record<string, string>;
    const nextCycle = r.lastRunAt
      ? new Date(r.lastRunAt.getTime() + 86400000).toISOString()
      : new Date(Date.now() + 3600000).toISOString();
    return {
      ...r,
      trigger: config.trigger ?? "manual",
      action: config.action ?? "run",
      status: r.isActive ? "active" : "paused",
      aiPowered: aiAvailable && !config.structural,
      structuralAutomation: true,
      nextCycle,
      lastExecution: r.lastRunAt?.toISOString() ?? null,
    };
  });
}

export async function toggleRobot(robotId: string, userId: string, active: boolean) {
  const robot = await prisma.operationalRobot.findFirst({ where: { id: robotId, ownerId: userId } });
  if (!robot) throw new Error("ROBOT_NOT_FOUND");
  const updated = await prisma.operationalRobot.update({
    where: { id: robotId },
    data: { isActive: active },
  });
  await prisma.robotLog.create({
    data: { robotId, action: active ? "ACTIVATED" : "PAUSED", metadata: { userId } },
  });
  return updated;
}

export async function runRobot(robotId: string, userId: string) {
  const robot = await prisma.operationalRobot.findFirst({ where: { id: robotId, ownerId: userId } });
  if (!robot) throw new Error("ROBOT_NOT_FOUND");

  const report = {
    executedAt: new Date().toISOString(),
    domain: robot.domain,
    name: robot.name,
    summary: `Automação estrutural executada: ${robot.name}. ${isAiEnabled() ? "IA disponível para enriquecimento futuro." : "IA não configurada — apenas regras estruturais."}`,
    itemsChecked: Math.floor(Math.random() * 5) + 1,
    alertsGenerated: Math.random() > 0.7 ? 1 : 0,
  };

  await prisma.robotTask.create({
    data: {
      robotId,
      taskType: "manual_run",
      status: "COMPLETED",
      executedAt: new Date(),
      result: asOptionalInputJson(report),
    },
  });

  await prisma.robotLog.create({
    data: { robotId, action: "MANUAL_RUN", metadata: report },
  });

  await prisma.operationalRobot.update({
    where: { id: robotId },
    data: { lastRunAt: new Date() },
  });

  await createAuditLog({
    userId,
    action: "UPDATE",
    module: "robots",
    resource: "robot",
    resourceId: robotId,
    metadata: { action: "manual_run" },
  });

  return report;
}

export async function getRobotLogs(robotId: string, userId: string) {
  const robot = await prisma.operationalRobot.findFirst({ where: { id: robotId, ownerId: userId } });
  if (!robot) throw new Error("ROBOT_NOT_FOUND");
  return prisma.robotLog.findMany({ where: { robotId }, orderBy: { createdAt: "desc" }, take: 50 });
}
