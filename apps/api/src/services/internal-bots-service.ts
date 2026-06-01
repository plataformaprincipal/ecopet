import type { PersonaScope } from "@prisma/client";
import { prisma } from "@ecopet/database";
import { asInputJson } from "../lib/prisma-json.js";
import { createAuditLog } from "./audit-service.js";

export const INTERNAL_BOT_FLAG_PREFIX = "bot.internal.";

export interface InternalBotDefinition {
  key: string;
  name: string;
  purpose: string;
  trigger: string;
  action: string;
  personaScope: PersonaScope;
}

/** Robôs estruturais mínimos da plataforma — controle via FeatureFlag. */
export const INTERNAL_BOTS: InternalBotDefinition[] = [
  {
    key: "audit",
    name: "Robô de Auditoria",
    purpose: "Registra e consolida eventos críticos de auditoria do sistema.",
    trigger: "Eventos audit.* e ações sensíveis de gestor",
    action: "Persistir log estruturado e emitir alerta interno",
    personaScope: "GESTOR",
  },
  {
    key: "notifications",
    name: "Robô de Notificações",
    purpose: "Distribui notificações in-app e prepara fila para e-mail/push.",
    trigger: "Novos eventos de pedido, pet, ticket e social",
    action: "Criar Notification e enfileirar envio",
    personaScope: "GLOBAL",
  },
  {
    key: "registration-review",
    name: "Robô de Revisão de Cadastro",
    purpose: "Triagem automática de novos cadastros públicos.",
    trigger: "user.registered",
    action: "Validar duplicidade documental e sinalizar aprovação",
    personaScope: "GESTOR",
  },
  {
    key: "error-alert",
    name: "Robô de Alerta de Erro",
    purpose: "Detecta erros recorrentes e incidentes de API.",
    trigger: "security_event.error e falhas HTTP 5xx",
    action: "Registrar incidente e notificar equipe técnica",
    personaScope: "GESTOR",
  },
  {
    key: "marketplace-monitor",
    name: "Robô de Acompanhamento de Marketplace",
    purpose: "Monitora pedidos, estoque baixo e avaliações críticas.",
    trigger: "order.* e product.stock_low",
    action: "Gerar alertas operacionais para parceiros e gestor",
    personaScope: "PARTNER",
  },
  {
    key: "pet-management",
    name: "Robô de Gestão de Pet",
    purpose: "Acompanha cadastros, prontuário e eventos do pet.",
    trigger: "pet.created, pet.updated, pet.lost",
    action: "Atualizar timeline e preparar notificações ao tutor",
    personaScope: "CLIENT",
  },
  {
    key: "vaccine-alert",
    name: "Robô de Alertas de Vacina",
    purpose: "Calcula vacinas próximas do vencimento.",
    trigger: "Cron diário / pet.vaccination_due",
    action: "Criar lembrete e notificação ao tutor",
    personaScope: "CLIENT",
  },
  {
    key: "ticket-triage",
    name: "Robô de Triagem de Chamados",
    purpose: "Classifica tickets de suporte por prioridade e SLA.",
    trigger: "ticket.created",
    action: "Atribuir fila, prioridade e SLA inicial",
    personaScope: "GESTOR",
  },
  {
    key: "initial-support",
    name: "Robô de Suporte Inicial",
    purpose: "Responde dúvidas frequentes antes do atendimento humano.",
    trigger: "conversation.created (canal suporte)",
    action: "Enviar mensagem estrutural de boas-vindas e FAQ",
    personaScope: "GLOBAL",
  },
];

const AI_NOTICE =
  "Automação estrutural disponível. IA real será ativada após configuração da API.";

function flagKey(botKey: string) {
  return `${INTERNAL_BOT_FLAG_PREFIX}${botKey}`;
}

export async function ensureInternalBotsSeeded() {
  for (const bot of INTERNAL_BOTS) {
    const key = flagKey(bot.key);
    const exists = await prisma.featureFlag.findUnique({ where: { key } });
    if (!exists) {
      await prisma.featureFlag.create({
        data: {
          key,
          name: bot.name,
          description: bot.purpose,
          enabled: true,
          personaScope: bot.personaScope,
          metadata: asInputJson({
            trigger: bot.trigger,
            action: bot.action,
            structuralOnly: true,
            aiNotice: AI_NOTICE,
          }),
        },
      });
    }
  }
}

export async function listInternalBots() {
  await ensureInternalBotsSeeded();
  const flags = await prisma.featureFlag.findMany({
    where: { key: { startsWith: INTERNAL_BOT_FLAG_PREFIX } },
    orderBy: { key: "asc" },
  });

  const logs = await prisma.securityEvent.findMany({
    where: { eventType: { startsWith: "BOT_" } },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return INTERNAL_BOTS.map((bot) => {
    const flag = flags.find((f) => f.key === flagKey(bot.key));
    const botLogs = logs.filter((l) => {
      const meta = l.metadata as Record<string, unknown> | null;
      return meta?.botKey === bot.key;
    });
    return {
      ...bot,
      enabled: flag?.enabled ?? false,
      status: flag?.enabled ? "active" : "paused",
      aiNotice: AI_NOTICE,
      logs: botLogs.slice(0, 10).map((l) => ({
        id: l.id,
        at: l.createdAt.toISOString(),
        severity: l.severity,
        message: (l.metadata as Record<string, unknown> | null)?.message ?? l.eventType,
      })),
    };
  });
}

export async function setInternalBotEnabled(botKey: string, enabled: boolean, actorId?: string) {
  const bot = INTERNAL_BOTS.find((b) => b.key === botKey);
  if (!bot) throw Object.assign(new Error("Robô não encontrado"), { status: 404 });

  await ensureInternalBotsSeeded();
  const flag = await prisma.featureFlag.update({
    where: { key: flagKey(botKey) },
    data: { enabled },
  });

  await prisma.securityEvent.create({
    data: {
      userId: actorId,
      eventType: enabled ? "BOT_ACTIVATED" : "BOT_DEACTIVATED",
      severity: "info",
      metadata: asInputJson({
        botKey,
        botName: bot.name,
        message: enabled ? `${bot.name} ativado` : `${bot.name} desativado`,
      }),
    },
  });

  await createAuditLog({
    userId: actorId,
    action: "UPDATE",
    module: "automation",
    resource: "internal_bot",
    resourceId: botKey,
    observation: enabled ? `${bot.name} ativado` : `${bot.name} pausado`,
  });

  return { ...bot, enabled: flag.enabled, status: flag.enabled ? "active" : "paused", aiNotice: AI_NOTICE };
}

export async function logInternalBotRun(botKey: string, message: string, severity = "info") {
  const bot = INTERNAL_BOTS.find((b) => b.key === botKey);
  if (!bot) return;

  const flag = await prisma.featureFlag.findUnique({ where: { key: flagKey(botKey) } });
  if (!flag?.enabled) return;

  await prisma.securityEvent.create({
    data: {
      eventType: "BOT_RUN",
      severity,
      metadata: asInputJson({ botKey, botName: bot.name, message }),
    },
  });
}

export function isInternalBotEnabledSync(enabledFlags: Set<string>, botKey: string) {
  return enabledFlags.has(flagKey(botKey));
}
