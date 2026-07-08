import type { PrismaClient } from "@prisma/client";

export type ClientAutomation = {
  id: string;
  name: string;
  category: string;
  trigger: string;
  action: string;
  isActive: boolean;
  source: "iot" | "reminder" | "health" | "finance";
  petName?: string | null;
  dueAt?: string | null;
};

export type ClientAutomationsPanel = {
  automations: ClientAutomation[];
  smartHome: {
    platforms: Array<{ id: string; name: string; status: "pending" | "connected" }>;
    scenarios: Array<{ id: string; name: string; description: string; status: "pending" }>;
  };
};

const SMART_HOME_PLATFORMS = [
  { id: "alexa", name: "Amazon Alexa" },
  { id: "google", name: "Google Home" },
  { id: "apple", name: "Apple Home" },
  { id: "smartthings", name: "Samsung SmartThings" },
] as const;

const SMART_HOME_SCENARIOS = [
  { id: "feed", name: "Alimentar pet", description: "Disparar comedouro no horário da rotina" },
  { id: "water", name: "Liberar água", description: "Ativar bebedouro inteligente" },
  { id: "camera", name: "Acionar câmera", description: "Gravar ou transmitir ao detectar movimento" },
  { id: "escape", name: "Alerta de fuga", description: "Notificar quando o pet sair da cerca virtual" },
  { id: "low-activity", name: "Alerta de baixa atividade", description: "Avisar quando a atividade cair abaixo do normal" },
  { id: "medication", name: "Alerta de medicamento", description: "Lembrete e confirmação de medicação" },
] as const;

export async function buildClientAutomationsPanel(
  prisma: PrismaClient,
  userId: string
): Promise<ClientAutomationsPanel> {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const pets = await prisma.pet.findMany({
    where: { ownerId: userId, deletedAt: null },
    select: { id: true },
  });
  const petIds = pets.map((p) => p.id);

  const [iotAutomations, reminders, vaccinesDue, monthSpend] = await Promise.all([
    prisma.iotAutomation.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    petIds.length
      ? prisma.petReminder.findMany({
          where: { petId: { in: petIds }, status: "PENDING" },
          include: { pet: { select: { name: true } } },
          orderBy: { dueAt: "asc" },
          take: 30,
        })
      : Promise.resolve([]),
    petIds.length
      ? prisma.vaccination.findMany({
          where: { petId: { in: petIds }, nextDue: { gte: now } },
          include: { pet: { select: { name: true } } },
          orderBy: { nextDue: "asc" },
          take: 10,
        })
      : Promise.resolve([]),
    prisma.order.aggregate({
      _sum: { total: true },
      where: { userId, createdAt: { gte: monthStart } },
    }),
  ]);

  const automations: ClientAutomation[] = [];

  for (const a of iotAutomations) {
    automations.push({
      id: a.id,
      name: a.name,
      category: "IoT",
      trigger: a.trigger,
      action: a.action,
      isActive: a.isActive,
      source: "iot",
    });
  }

  for (const r of reminders) {
    const cat = categorizeReminder(r.type, r.title);
    automations.push({
      id: `reminder-${r.id}`,
      name: r.title,
      category: cat,
      trigger: `Lembrete · ${cat}`,
      action: r.description ?? "Executar cuidado programado",
      isActive: true,
      source: "reminder",
      petName: r.pet.name,
      dueAt: r.dueAt.toISOString(),
    });
  }

  for (const v of vaccinesDue) {
    automations.push({
      id: `vaccine-${v.id}`,
      name: `Vacina: ${v.name}`,
      category: "Vacina",
      trigger: "Data de reforço",
      action: `Agendar vacina para ${v.pet.name}`,
      isActive: true,
      source: "health",
      petName: v.pet.name,
      dueAt: v.nextDue ? v.nextDue.toISOString() : null,
    });
  }

  const spent = monthSpend._sum.total ?? 0;
  if (spent > 500) {
    automations.push({
      id: "finance-alert-month",
      name: "Alerta de gasto elevado",
      category: "Financeiro",
      trigger: `Gastos do mês acima de R$ 500`,
      action: `Total atual: R$ ${spent.toFixed(2)} — revisar compras`,
      isActive: true,
      source: "finance",
    });
  }

  return {
    automations,
    smartHome: {
      platforms: SMART_HOME_PLATFORMS.map((p) => ({
        id: p.id,
        name: p.name,
        status: "pending" as const,
      })),
      scenarios: SMART_HOME_SCENARIOS.map((s) => ({
        ...s,
        status: "pending" as const,
      })),
    },
  };
}

function categorizeReminder(type: string, title: string): string {
  const hay = `${type} ${title}`.toLowerCase();
  if (/vacin/.test(hay)) return "Vacina";
  if (/medic|remed/.test(hay)) return "Medicamento";
  if (/consul|vet/.test(hay)) return "Consulta";
  if (/ração|racao|aliment|feed/.test(hay)) return "Recompra";
  if (/rotina|diári|diari/.test(hay)) return "Rotina diária";
  if (/saúde|saude|health/.test(hay)) return "Saúde";
  return "Lembrete";
}
