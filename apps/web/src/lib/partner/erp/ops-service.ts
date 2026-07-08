import type { PrismaClient } from "@prisma/client";
import type { ErpModuleResponse } from "@/lib/admin/erp/types";
import { isAIProviderConfigured } from "@/lib/ai/provider";
import { kpi } from "./types";
import { loadPartnerErpStore, loadPartnerAuditTrail } from "./store";
import { PARTNER_GROWTH_AI_ASSISTANTS } from "./growth-service";

const IOT_LABELS: Record<string, string> = {
  SENSOR: "Sensor",
  SCALE: "Balança",
  COLLAR: "Coleira",
  CAMERA: "Câmera",
  TEMPERATURE: "Temperatura",
  ENERGY: "Energia",
  GPS: "GPS",
  FEEDER: "Comedouro",
};

function iotLabel(type: string) {
  const u = type.toUpperCase();
  return IOT_LABELS[u] ?? type;
}

type InfraStore = {
  units: Array<Record<string, unknown>>;
  rooms: Array<Record<string, unknown>>;
  equipment: Array<Record<string, unknown>>;
  maintenance: Array<Record<string, unknown>>;
};

const EMPTY_INFRA: InfraStore = {
  units: [],
  rooms: [],
  equipment: [],
  maintenance: [],
};

type EquipStore = {
  computers: Array<Record<string, unknown>>;
  printers: Array<Record<string, unknown>>;
  collectors: Array<Record<string, unknown>>;
  readers: Array<Record<string, unknown>>;
  machines: Array<Record<string, unknown>>;
  cameras: Array<Record<string, unknown>>;
};

const EMPTY_EQUIP: EquipStore = {
  computers: [],
  printers: [],
  collectors: [],
  readers: [],
  machines: [],
  cameras: [],
};

export async function getPartnerInfraestruturaModule(prisma: PrismaClient, partnerId: string): Promise<ErpModuleResponse> {
  const store = await loadPartnerErpStore(partnerId, "infraestrutura", EMPTY_INFRA);
  const profile = await prisma.partnerProfile.findUnique({
    where: { userId: partnerId },
    select: { businessName: true, address: true, city: true, state: true, operationDetails: true },
  });

  const units =
    store.units.length > 0
      ? store.units
      : profile
        ? [
            {
              id: "main-unit",
              nome: profile.businessName,
              endereco: profile.address,
              cidade: profile.city,
              estado: profile.state,
              origem: "perfil comercial",
            },
          ]
        : [];

  const devices = await prisma.iotDevice.findMany({
    where: { OR: [{ userId: partnerId }, { ownerId: partnerId }] },
    select: { id: true, name: true, deviceType: true, status: true },
    take: 20,
  });

  const equipment = [
    ...store.equipment,
    ...devices.map((d) => ({
      id: d.id,
      nome: d.name,
      tipo: iotLabel(d.deviceType),
      status: d.status,
      origem: "IoT vinculado",
    })),
  ];

  const audit = await loadPartnerAuditTrail(partnerId, "infraestrutura");

  return {
    moduleId: "infraestrutura",
    title: "Infraestrutura",
    kpis: [
      kpi("units", "Unidades", units.length),
      kpi("rooms", "Salas", store.rooms.length),
      kpi("equipment", "Equipamentos", equipment.length),
      kpi("maintenance", "Manutenções", store.maintenance.length),
    ],
    tables: [
      { id: "units", label: "Unidades", rows: units },
      { id: "rooms", label: "Salas", rows: store.rooms },
      { id: "equipment", label: "Equipamentos", rows: equipment },
      { id: "maintenance", label: "Manutenção", rows: store.maintenance },
    ],
    tabs: [
      { id: "units", label: "Unidades" },
      { id: "rooms", label: "Salas" },
      { id: "equipment", label: "Equipamentos" },
      { id: "maintenance", label: "Manutenção" },
    ],
    timeline: audit.map((a) => ({ id: a.id, date: a.createdAt, title: a.resource, actor: a.actor })),
    disclaimer: units.length === 0 ? "Cadastre unidades e salas da operação." : undefined,
  };
}

export async function getPartnerEquipamentosModule(prisma: PrismaClient, partnerId: string): Promise<ErpModuleResponse> {
  const store = await loadPartnerErpStore(partnerId, "equipamentos", EMPTY_EQUIP);
  const devices = await prisma.iotDevice.findMany({
    where: { OR: [{ userId: partnerId }, { ownerId: partnerId }] },
    orderBy: { updatedAt: "desc" },
    take: 30,
  });

  const byType = (types: string[]) =>
    devices
      .filter((d) => types.some((t) => d.deviceType.toUpperCase().includes(t)))
      .map((d) => ({
        id: d.id,
        nome: d.name,
        tipo: d.deviceType,
        status: d.status,
        bateria: d.battery,
        sync: d.lastSyncAt?.toISOString() ?? null,
      }));

  const computers = [...store.computers, ...byType(["COMPUTER", "PC", "TABLET"])];
  const printers = [...store.printers, ...byType(["PRINTER", "PRINT"])];
  const collectors = [...store.collectors, ...byType(["COLLECTOR", "SCANNER", "COLETOR"])];
  const readers = [...store.readers, ...byType(["READER", "LEITOR", "BARCODE"])];
  const machines = [...store.machines, ...byType(["MACHINE", "MAQUINA", "ROBOT", "DRONE"])];
  const cameras = [...store.cameras, ...byType(["CAMERA", "CAM"])];

  const total =
    computers.length + printers.length + collectors.length + readers.length + machines.length + cameras.length;

  return {
    moduleId: "equipamentos",
    title: "Equipamentos",
    kpis: [
      kpi("total", "Total", total),
      kpi("computers", "Computadores", computers.length),
      kpi("machines", "Máquinas", machines.length),
      kpi("cameras", "Câmeras", cameras.length),
    ],
    tables: [
      { id: "computers", label: "Computadores", rows: computers },
      { id: "printers", label: "Impressoras", rows: printers },
      { id: "collectors", label: "Coletores", rows: collectors },
      { id: "readers", label: "Leitores", rows: readers },
      { id: "machines", label: "Máquinas / Maquinário", rows: machines },
      { id: "cameras", label: "Câmeras", rows: cameras },
    ],
    tabs: [
      { id: "computers", label: "Computadores" },
      { id: "printers", label: "Impressoras" },
      { id: "machines", label: "Maquinário" },
      { id: "cameras", label: "Câmeras" },
    ],
    disclaimer: total === 0 ? "Nenhum equipamento cadastrado. Vincule dispositivos IoT ou cadastre manualmente." : undefined,
  };
}

export async function getPartnerIotModule(prisma: PrismaClient, partnerId: string): Promise<ErpModuleResponse> {
  const devices = await prisma.iotDevice.findMany({
    where: { OR: [{ userId: partnerId }, { ownerId: partnerId }] },
    include: {
      alerts: { where: { resolved: false }, take: 5 },
      readings: { orderBy: { recordedAt: "desc" }, take: 3 },
    },
    orderBy: { lastSyncAt: "desc" },
    take: 40,
  });

  const alerts = devices.flatMap((d) => d.alerts);
  const sensors = devices.filter((d) => /sensor|temp|energy|energia/i.test(d.deviceType));
  const scales = devices.filter((d) => /scale|balan/i.test(d.deviceType));
  const collars = devices.filter((d) => /collar|coleira|gps/i.test(d.deviceType));
  const cameras = devices.filter((d) => /camera/i.test(d.deviceType));

  return {
    moduleId: "iot",
    title: "IoT",
    kpis: [
      kpi("devices", "Dispositivos", devices.length),
      kpi("online", "Online", devices.filter((d) => d.status === "online").length),
      kpi("alerts", "Alertas", alerts.length, { variant: alerts.length > 0 ? "warning" : "default" }),
      kpi("sensors", "Sensores", sensors.length),
    ],
    tables: [
      {
        id: "devices",
        label: "Dispositivos",
        rows: devices.map((d) => ({
          id: d.id,
          nome: d.name,
          tipo: iotLabel(d.deviceType),
          status: d.status,
          bateria: d.battery,
          sync: d.lastSyncAt?.toISOString() ?? null,
          alertas: d.alerts.length,
        })),
      },
      { id: "sensors", label: "Sensores / Temperatura / Energia", rows: sensors.map((d) => ({ id: d.id, nome: d.name, tipo: d.deviceType })) },
      { id: "scales", label: "Balanças", rows: scales.map((d) => ({ id: d.id, nome: d.name, status: d.status })) },
      { id: "collars", label: "Coleiras / GPS", rows: collars.map((d) => ({ id: d.id, nome: d.name, status: d.status })) },
      { id: "cameras", label: "Câmeras", rows: cameras.map((d) => ({ id: d.id, nome: d.name, status: d.status })) },
    ],
    alerts: alerts.map((a) => ({
      id: a.id,
      label: a.message,
      count: 1,
      severity: a.severity === "critical" ? ("critical" as const) : ("warning" as const),
    })),
    disclaimer: devices.length === 0 ? "Nenhum dispositivo IoT vinculado a este parceiro." : undefined,
  };
}

export async function getPartnerTiModule(prisma: PrismaClient, partnerId: string): Promise<ErpModuleResponse> {
  const store = await loadPartnerErpStore(partnerId, "ti", {
    users: [] as Record<string, unknown>[],
    backups: [] as Record<string, unknown>[],
    integrations: [] as Record<string, unknown>[],
    apis: [] as Record<string, unknown>[],
  });

  const [auditLogs, assignments, notifications, profile] = await Promise.all([
    prisma.auditLog.findMany({
      where: { module: { startsWith: "partner-erp" } },
      orderBy: { createdAt: "desc" },
      take: 30,
      include: { actor: { select: { name: true, email: true } } },
    }),
    prisma.userRbacAssignment.findMany({
      where: { userId: partnerId },
      include: { role: { select: { name: true, code: true } } },
      take: 10,
    }),
    prisma.notification.findMany({
      where: { userId: partnerId, type: "SYSTEM" },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
    prisma.partnerProfile.findUnique({
      where: { userId: partnerId },
      select: { verificationStatus: true, updatedAt: true },
    }),
  ]);

  const partnerLogs = auditLogs.filter((l) => {
    const meta = l.metadata as { partnerId?: string } | null;
    return !meta?.partnerId || meta.partnerId === partnerId;
  });

  const users = [
    ...store.users,
    ...assignments.map((a) => ({
      id: a.id,
      papel: a.role.name,
      codigo: a.role.code,
      desde: a.grantedAt.toISOString(),
    })),
  ];

  const apis = [
    ...store.apis,
    { id: "partner-erp", nome: "Partner ERP API", path: "/api/partner/erp/[module]", status: "ativo" },
    { id: "partner-orders", nome: "Pedidos", path: "/api/partner/orders", status: "ativo" },
    { id: "partner-products", nome: "Produtos", path: "/api/partner/products", status: "ativo" },
    { id: "partner-appointments", nome: "Agendamentos", path: "/api/partner/appointments", status: "ativo" },
  ];

  const integrations = [
    ...store.integrations,
    { id: "stripe", nome: "Stripe", status: "configurável" },
    { id: "cloudinary", nome: "Cloudinary", status: "mídia" },
  ];

  const backups = [
    ...store.backups,
    ...(profile
      ? [{ id: "profile-snapshot", tipo: "perfil comercial", data: profile.updatedAt.toISOString(), status: "disponível" }]
      : []),
  ];

  return {
    moduleId: "ti",
    title: "TI",
    kpis: [
      kpi("users", "Usuários / papéis", users.length),
      kpi("logs", "Logs ERP", partnerLogs.length),
      kpi("backups", "Backups", backups.length),
      kpi("apis", "APIs", apis.length),
      kpi("integrations", "Integrações", integrations.length),
      kpi("security", "Verificação", profile?.verificationStatus ?? "—"),
    ],
    tables: [
      { id: "users", label: "Usuários e acessos", rows: users },
      {
        id: "logs",
        label: "Logs",
        rows: partnerLogs.slice(0, 15).map((l) => ({
          id: l.id,
          acao: l.action,
          modulo: l.module,
          recurso: l.resource,
          ator: l.actor?.name ?? "—",
          data: l.createdAt.toISOString(),
        })),
      },
      { id: "backups", label: "Backups", rows: backups },
      { id: "integrations", label: "Integrações", rows: integrations },
      { id: "apis", label: "APIs", rows: apis },
      {
        id: "security",
        label: "Segurança",
        rows: notifications.map((n) => ({ id: n.id, titulo: n.title, prioridade: n.priority, data: n.createdAt.toISOString() })),
      },
    ],
    tabs: [
      { id: "users", label: "Usuários" },
      { id: "logs", label: "Logs" },
      { id: "backups", label: "Backups" },
      { id: "integrations", label: "Integrações" },
      { id: "apis", label: "APIs" },
      { id: "security", label: "Segurança" },
    ],
  };
}

export async function getPartnerAutomacoesModule(prisma: PrismaClient, partnerId: string): Promise<ErpModuleResponse> {
  const store = await loadPartnerErpStore(partnerId, "automacoes", {
    reminders: [] as Record<string, unknown>[],
  });

  const [workflows, iotAutomations, approvals, notifications] = await Promise.all([
    prisma.workflowInstance.findMany({
      where: { ownerId: partnerId },
      orderBy: { startedAt: "desc" },
      take: 15,
      include: { definition: { select: { name: true, triggerType: true } } },
    }),
    prisma.iotAutomation.findMany({
      where: { userId: partnerId },
      orderBy: { createdAt: "desc" },
      take: 15,
    }),
    prisma.approvalRequest.findMany({
      where: { requesterId: partnerId, status: "PENDING" },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
    prisma.notification.findMany({
      where: { userId: partnerId },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
  ]);

  const workflowRows = workflows.map((w) => ({
    id: w.id,
    nome: w.definition.name,
    gatilho: w.definition.triggerType,
    status: w.status,
    inicio: w.startedAt.toISOString(),
  }));

  const automationRows = iotAutomations.map((a) => ({
    id: a.id,
    nome: a.name,
    trigger: a.trigger,
    action: a.action,
    ativo: a.isActive,
  }));

  return {
    moduleId: "automacoes",
    title: "Automações",
    kpis: [
      kpi("workflows", "Workflows", workflows.length),
      kpi("iot", "Automações IoT", iotAutomations.length),
      kpi("approvals", "Aprovações pendentes", approvals.length, { variant: approvals.length > 0 ? "warning" : "default" }),
      kpi("notifications", "Notificações", notifications.length),
      kpi("reminders", "Lembretes", store.reminders.length),
    ],
    tables: [
      { id: "workflows", label: "Workflows", rows: workflowRows },
      { id: "automations", label: "Automações IoT", rows: automationRows },
      {
        id: "approvals",
        label: "Aprovações",
        rows: approvals.map((a) => ({ id: a.id, tipo: a.type, entidade: a.entityType, status: a.status, data: a.createdAt.toISOString() })),
      },
      {
        id: "notifications",
        label: "Notificações",
        rows: notifications.map((n) => ({ id: n.id, titulo: n.title, tipo: n.type, lida: n.read, data: n.createdAt.toISOString() })),
      },
      { id: "reminders", label: "Lembretes", rows: store.reminders },
    ],
    tabs: [
      { id: "workflows", label: "Workflows" },
      { id: "notifications", label: "Notificações" },
      { id: "reminders", label: "Lembretes" },
      { id: "approvals", label: "Aprovações" },
    ],
    disclaimer:
      workflows.length === 0 && iotAutomations.length === 0
        ? "Configure workflows e automações IoT para operar em escala."
        : undefined,
  };
}

export const PARTNER_AI_ASSISTANTS = [
  { id: "finance", label: "Assistente financeiro", agentId: "finance", description: "Fluxo de caixa, repasses e indicadores" },
  { id: "commercial", label: "Assistente comercial", agentId: "commercial", description: "Metas, CRM e vendas" },
  { id: "veterinary", label: "Assistente veterinário", agentId: "partner", description: "Clínica, agenda e saúde animal" },
  { id: "admin", label: "Assistente administrativo", agentId: "partner", description: "Processos, tarefas e operação" },
  { id: "inventory", label: "Assistente de estoque", agentId: "partner", description: "Produtos, estoque e reposição" },
  { id: "marketing", label: "Assistente de marketing", agentId: "marketing", description: "Campanhas e visibilidade" },
] as const;

export const ALL_PARTNER_AI_ASSISTANTS = [...PARTNER_AI_ASSISTANTS, ...PARTNER_GROWTH_AI_ASSISTANTS] as const;

export async function getPartnerIaModule(prisma: PrismaClient, partnerId: string): Promise<ErpModuleResponse> {
  const configured = isAIProviderConfigured();
  const [aiLogs, aiConversations] = await Promise.all([
    prisma.aILog.findMany({
      where: { userId: partnerId },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: { id: true, agentId: true, durationMs: true, errorCode: true, createdAt: true },
    }),
    prisma.aIConversation.findMany({
      where: { userId: partnerId },
      orderBy: { updatedAt: "desc" },
      take: 5,
      select: { id: true, title: true, updatedAt: true },
    }),
  ]);

  return {
    moduleId: "ia",
    title: "Inteligência Artificial",
    kpis: [
      kpi("assistants", "Assistentes", ALL_PARTNER_AI_ASSISTANTS.length),
      kpi("conversations", "Conversas", aiConversations.length),
      kpi("logs", "Execuções IA", aiLogs.length),
      kpi("status", "Provedor", configured ? "Configurado" : "Pendente", {
        variant: configured ? "success" : "warning",
      }),
    ],
    items: ALL_PARTNER_AI_ASSISTANTS.map((a) => ({
      id: a.id,
      nome: a.label,
      agentId: a.agentId,
      descricao: a.description,
      endpoint: "/api/partner/erp/ia/chat",
    })),
    tables: [
      {
        id: "assistants",
        label: "Assistentes disponíveis",
        rows: ALL_PARTNER_AI_ASSISTANTS.map((a) => ({ id: a.id, assistente: a.label, agente: a.agentId, descricao: a.description })),
      },
      {
        id: "conversations",
        label: "Conversas recentes",
        rows: aiConversations.map((c) => ({ id: c.id, titulo: c.title ?? "Conversa", atualizado: c.updatedAt.toISOString() })),
      },
      {
        id: "logs",
        label: "Logs de IA",
        rows: aiLogs.map((l) => ({
          id: l.id,
          agente: l.agentId,
          status: l.errorCode ? "erro" : "ok",
          latencia: l.durationMs,
          data: l.createdAt.toISOString(),
        })),
      },
    ],
    quickActions: ALL_PARTNER_AI_ASSISTANTS.map((a) => ({
      label: a.label,
      href: `/partner/ia?assistant=${a.id}`,
    })),
    disclaimer: configured
      ? "Toda IA utiliza o AI Orchestrator. Use POST /api/partner/erp/ia/chat."
      : "IA ainda não configurada. Assistentes disponíveis após integração do provedor.",
    aiConfigured: configured,
  };
}
