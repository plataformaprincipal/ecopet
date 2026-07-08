import type { PrismaClient } from "@prisma/client";
import type { ErpModuleResponse } from "@/lib/admin/erp/types";
import { kpi } from "./types";
import { loadNgoErpStore } from "./store";

function monthStart() {
  const d = new Date();
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d;
}

function inMonth(dateStr: unknown, start = monthStart()) {
  if (!dateStr || typeof dateStr !== "string") return false;
  return new Date(dateStr) >= start;
}

function sumAmount(rows: Array<Record<string, unknown>>, field = "valor") {
  return rows.reduce((s, r) => s + (Number(r[field]) || 0), 0);
}

function filterCategory(expenses: Array<Record<string, unknown>>, ...keys: string[]) {
  return expenses.filter((e) => {
    const cat = String(e.categoria ?? e.category ?? "").toLowerCase();
    return keys.some((k) => cat.includes(k));
  });
}

type FinanceStore = {
  revenues: Array<Record<string, unknown>>;
  expenses: Array<Record<string, unknown>>;
  payables: Array<Record<string, unknown>>;
  receivables: Array<Record<string, unknown>>;
  receipts: Array<Record<string, unknown>>;
  vouchers: Array<Record<string, unknown>>;
  reports: Array<Record<string, unknown>>;
  accountability: Array<Record<string, unknown>>;
  forecasts: Array<Record<string, unknown>>;
};

const EMPTY_FINANCE: FinanceStore = {
  revenues: [],
  expenses: [],
  payables: [],
  receivables: [],
  receipts: [],
  vouchers: [],
  reports: [],
  accountability: [],
  forecasts: [],
};

export async function getNgoFinanceiroModule(prisma: PrismaClient, ongId: string): Promise<ErpModuleResponse> {
  const store = await loadNgoErpStore(ongId, "financeiro", EMPTY_FINANCE);
  const donationStore = await loadNgoErpStore(ongId, "doacoes", {
    donations: [] as Array<Record<string, unknown>>,
    recurring: [] as Array<Record<string, unknown>>,
  });

  const [campaignAgg, campaigns, animalsCount] = await Promise.all([
    prisma.campaign.aggregate({ where: { ongId }, _sum: { raisedAmount: true } }),
    prisma.campaign.findMany({
      where: { ongId },
      select: { id: true, title: true, raisedAmount: true, goalAmount: true, status: true, category: true },
      take: 20,
    }),
    prisma.adoptionListing.count({ where: { ongId } }),
  ]);

  const monthDonations = donationStore.donations.filter(
    (d) => inMonth(d.data) && d.status === "recebida"
  );
  const monthExpenses = store.expenses.filter((e) => inMonth(e.data));
  const monthRevenues = store.revenues.filter((r) => inMonth(r.data));

  const donationsMonth = sumAmount(monthDonations);
  const expensesMonth = sumAmount(monthExpenses);
  const revenuesMonth = sumAmount(monthRevenues);
  const campaignsRaised = campaignAgg._sum.raisedAmount ?? 0;
  const receivedDonations = sumAmount(
    donationStore.donations.filter((d) => d.status === "recebida")
  );
  const balance =
    sumAmount(store.revenues) + receivedDonations - sumAmount(store.expenses);

  const pendingPayables = store.payables.filter((p) => p.status === "pendente");
  const pendingReceivables = store.receivables.filter((r) => r.status === "pendente");
  const forecast = sumAmount(store.forecasts.length ? store.forecasts : monthExpenses);

  const feedSpend = sumAmount(filterCategory(store.expenses, "ração", "racao", "food", "alimento"));
  const vetSpend = sumAmount(filterCategory(store.expenses, "veterin", "clinica", "consulta"));
  const medSpend = sumAmount(filterCategory(store.expenses, "medic", "farmacia", "remedio"));

  const avgCostPerAnimal =
    animalsCount > 0 ? Math.round((expensesMonth / animalsCount) * 100) / 100 : 0;

  const donationRows: Array<Record<string, unknown>> = donationStore.donations.map((d) => ({
    id: d.id,
    doador: d.doador ?? d.donor ?? "—",
    valor: d.valor ?? d.amount,
    tipo: d.tipo ?? "financeira",
    status: d.status,
    data: d.data ?? d.createdAt,
    comprovante: d.comprovante ?? "—",
    recibo: d.recibo ?? "—",
  }));

  return {
    moduleId: "financeiro",
    title: "Financeiro ONG",
    kpis: [
      kpi("balance", "Saldo disponível", `R$ ${balance.toFixed(2)}`),
      kpi("donations-month", "Doações do mês", `R$ ${donationsMonth.toFixed(2)}`),
      kpi("expenses-month", "Despesas do mês", `R$ ${expensesMonth.toFixed(2)}`, {
        variant: expensesMonth > donationsMonth ? "warning" : "default",
      }),
      kpi("campaigns", "Campanhas arrecadadas", `R$ ${campaignsRaised.toFixed(2)}`),
      kpi("pending", "Pendências", pendingPayables.length + pendingReceivables.length, {
        variant: pendingPayables.length + pendingReceivables.length > 0 ? "warning" : "default",
      }),
      kpi("forecast", "Previsão de custos", `R$ ${forecast.toFixed(2)}`),
      kpi("avg-animal", "Custo médio/animal", `R$ ${avgCostPerAnimal.toFixed(2)}`),
      kpi("feed", "Gasto com ração", `R$ ${feedSpend.toFixed(2)}`),
      kpi("vet", "Gasto veterinário", `R$ ${vetSpend.toFixed(2)}`),
      kpi("meds", "Gasto medicamentos", `R$ ${medSpend.toFixed(2)}`),
    ],
    tables: [
      { id: "revenues", label: "Receitas", rows: store.revenues },
      { id: "expenses", label: "Despesas", rows: store.expenses },
      { id: "donations", label: "Doações", rows: donationRows },
      { id: "payables", label: "Contas a pagar", rows: store.payables },
      { id: "receivables", label: "Contas a receber", rows: store.receivables },
      {
        id: "cashflow",
        label: "Fluxo de caixa",
        rows: [
          {
            id: "month",
            receitas: revenuesMonth + donationsMonth,
            despesas: expensesMonth,
            saldo: balance,
          },
        ],
      },
      { id: "accountability", label: "Prestação de contas", rows: store.accountability },
      { id: "receipts", label: "Recibos", rows: store.receipts },
      { id: "vouchers", label: "Comprovantes", rows: store.vouchers },
      { id: "reports", label: "Relatórios", rows: store.reports },
      {
        id: "campaigns",
        label: "Campanhas (arrecadação)",
        rows: campaigns.map((c) => ({
          id: c.id,
          titulo: c.title,
          arrecadado: c.raisedAmount,
          meta: c.goalAmount,
          status: c.status,
          categoria: c.category,
        })),
      },
    ],
    tabs: [
      { id: "revenues", label: "Receitas" },
      { id: "expenses", label: "Despesas" },
      { id: "donations", label: "Doações" },
      { id: "payables", label: "A pagar" },
      { id: "receivables", label: "A receber" },
      { id: "cashflow", label: "Fluxo de caixa" },
      { id: "accountability", label: "Prestação de contas" },
      { id: "receipts", label: "Recibos" },
      { id: "vouchers", label: "Comprovantes" },
      { id: "reports", label: "Relatórios" },
    ],
    disclaimer:
      store.expenses.length === 0 && donationRows.length === 0
        ? "Registre receitas e despesas via POST /api/ong/erp/financeiro. Campanhas usam dados reais do Prisma."
        : undefined,
  };
}

type AdminStore = {
  tasks: Array<Record<string, unknown>>;
  documents: Array<Record<string, unknown>>;
  processes: Array<Record<string, unknown>>;
  communications: Array<Record<string, unknown>>;
  calendar: Array<Record<string, unknown>>;
  responsibles: Array<Record<string, unknown>>;
  checklists: Array<Record<string, unknown>>;
  internalRequests: Array<Record<string, unknown>>;
};

const EMPTY_ADMIN: AdminStore = {
  tasks: [],
  documents: [],
  processes: [],
  communications: [],
  calendar: [],
  responsibles: [],
  checklists: [],
  internalRequests: [],
};

export async function getNgoAdministrativoModule(prisma: PrismaClient, ongId: string): Promise<ErpModuleResponse> {
  const store = await loadNgoErpStore(ongId, "administrativo", EMPTY_ADMIN);
  const [tickets, campaigns] = await Promise.all([
    prisma.supportTicket.findMany({
      where: { requesterId: ongId },
      orderBy: { updatedAt: "desc" },
      take: 10,
      select: { id: true, subject: true, status: true, priority: true, updatedAt: true },
    }),
    prisma.campaign.findMany({
      where: { ongId, deadline: { gte: new Date() } },
      orderBy: { deadline: "asc" },
      take: 10,
      select: { id: true, title: true, deadline: true, status: true },
    }),
  ]);

  const calendarRows =
    store.calendar.length > 0
      ? store.calendar
      : campaigns.map((c) => ({
          id: c.id,
          titulo: c.title,
          data: c.deadline?.toISOString() ?? "",
          status: c.status,
          origem: "campanha",
        }));

  const openTasks = store.tasks.filter((t) => t.status !== "concluida").length;

  return {
    moduleId: "administrativo",
    title: "Administrativo",
    kpis: [
      kpi("tasks", "Tarefas abertas", openTasks),
      kpi("documents", "Documentos", store.documents.length),
      kpi("processes", "Processos", store.processes.length),
      kpi("communications", "Comunicados", store.communications.length),
      kpi("calendar", "Eventos", calendarRows.length),
      kpi("requests", "Solicitações", store.internalRequests.length),
      kpi("tickets", "Chamados", tickets.length),
    ],
    tables: [
      { id: "tasks", label: "Tarefas", rows: store.tasks },
      { id: "documents", label: "Documentos", rows: store.documents },
      { id: "processes", label: "Processos internos", rows: store.processes },
      { id: "communications", label: "Comunicados", rows: store.communications },
      { id: "calendar", label: "Calendário", rows: calendarRows },
      { id: "responsibles", label: "Responsáveis", rows: store.responsibles },
      { id: "checklists", label: "Checklist operacional", rows: store.checklists },
      { id: "requests", label: "Solicitações internas", rows: store.internalRequests },
      {
        id: "tickets",
        label: "Chamados suporte",
        rows: tickets.map((t) => ({
          id: t.id,
          assunto: t.subject,
          status: t.status,
          prioridade: t.priority,
          atualizado: t.updatedAt.toISOString(),
        })),
      },
    ],
    tabs: [
      { id: "tasks", label: "Tarefas" },
      { id: "documents", label: "Documentos" },
      { id: "processes", label: "Processos" },
      { id: "communications", label: "Comunicados" },
      { id: "calendar", label: "Calendário" },
      { id: "responsibles", label: "Responsáveis" },
      { id: "checklists", label: "Checklist" },
      { id: "requests", label: "Solicitações" },
    ],
  };
}

type SpaceStore = {
  shelters: Array<Record<string, unknown>>;
  bays: Array<Record<string, unknown>>;
  rooms: Array<Record<string, unknown>>;
  quarantine: Array<Record<string, unknown>>;
  feedStock: Array<Record<string, unknown>>;
  medStock: Array<Record<string, unknown>>;
  maintenance: Array<Record<string, unknown>>;
  cleaning: Array<Record<string, unknown>>;
  security: Array<Record<string, unknown>>;
  temperature: Array<Record<string, unknown>>;
  incidents: Array<Record<string, unknown>>;
};

const EMPTY_SPACE: SpaceStore = {
  shelters: [],
  bays: [],
  rooms: [],
  quarantine: [],
  feedStock: [],
  medStock: [],
  maintenance: [],
  cleaning: [],
  security: [],
  temperature: [],
  incidents: [],
};

export async function getNgoEspacoFisicoModule(prisma: PrismaClient, ongId: string): Promise<ErpModuleResponse> {
  const store = await loadNgoErpStore(ongId, "espaco-fisico", EMPTY_SPACE);
  const [profile, listings, petsInCare] = await Promise.all([
    prisma.ongProfile.findUnique({
      where: { userId: ongId },
      select: { address: true, city: true, state: true, animalCapacity: true },
    }),
    prisma.adoptionListing.findMany({
      where: { ongId },
      select: { id: true, name: true, status: true, requirements: true },
    }),
    prisma.pet.count({ where: { ongId } }),
  ]);

  const occupied = listings.filter((l) => l.status !== "ADOPTED").length + petsInCare;
  const capacity = profile?.animalCapacity ?? 0;
  const occupancyPct = capacity > 0 ? Math.round((occupied / capacity) * 100) : 0;

  const shelters =
    store.shelters.length > 0
      ? store.shelters
      : profile
        ? [
            {
              id: "main",
              nome: "Abrigo principal",
              endereco: profile.address,
              cidade: profile.city,
              capacidade: capacity,
            },
          ]
        : [];

  const maintenanceAreas = store.maintenance.filter((m) => m.status === "em_andamento").length;
  const criticalFeed = store.feedStock.filter((f) => Number(f.quantidade) <= Number(f.minimo ?? 0)).length;
  const criticalMed = store.medStock.filter((m) => Number(m.quantidade) <= Number(m.minimo ?? 0)).length;
  const sanitaryAlerts = store.incidents.filter((i) => i.tipo === "sanitario").length + criticalFeed + criticalMed;

  return {
    moduleId: "espaco-fisico",
    title: "Espaço Físico",
    kpis: [
      kpi("capacity", "Capacidade total", capacity || "—"),
      kpi("occupancy", "Ocupação atual", occupied),
      kpi("occupancy-pct", "Lotação (%)", `${occupancyPct}%`, {
        variant: occupancyPct > 90 ? "critical" : occupancyPct > 70 ? "warning" : "default",
      }),
      kpi("areas", "Animais no abrigo", occupied),
      kpi("maintenance", "Áreas em manutenção", maintenanceAreas),
      kpi("alerts", "Alertas sanitários", sanitaryAlerts, {
        variant: sanitaryAlerts > 0 ? "warning" : "default",
      }),
    ],
    tables: [
      { id: "shelters", label: "Abrigos", rows: shelters },
      { id: "bays", label: "Baias", rows: store.bays },
      { id: "rooms", label: "Salas", rows: store.rooms },
      { id: "quarantine", label: "Quarentena", rows: store.quarantine },
      { id: "feed", label: "Estoque de ração", rows: store.feedStock },
      { id: "meds", label: "Estoque medicamentos", rows: store.medStock },
      { id: "maintenance", label: "Manutenção", rows: store.maintenance },
      { id: "cleaning", label: "Limpeza", rows: store.cleaning },
      { id: "security", label: "Segurança", rows: store.security },
      { id: "temperature", label: "Temperatura", rows: store.temperature },
      { id: "incidents", label: "Ocorrências", rows: store.incidents },
      {
        id: "animals-area",
        label: "Animais por área",
        rows: listings.slice(0, 20).map((l) => ({
          id: l.id,
          nome: l.name,
          status: l.status,
        })),
      },
    ],
    tabs: [
      { id: "shelters", label: "Abrigos" },
      { id: "bays", label: "Baias" },
      { id: "quarantine", label: "Quarentena" },
      { id: "feed", label: "Ração" },
      { id: "meds", label: "Medicamentos" },
      { id: "maintenance", label: "Manutenção" },
      { id: "incidents", label: "Ocorrências" },
    ],
  };
}

export const NGO_VOLUNTEER_FUNCTIONS = [
  "transporte",
  "lar_temporario",
  "eventos",
  "banho",
  "alimentacao",
  "limpeza",
  "socializacao",
  "fotografia",
  "marketing",
  "administrativo",
] as const;

export const NGO_VOLUNTEER_FUNCTION_LABELS: Record<string, string> = {
  transporte: "Transporte",
  lar_temporario: "Lar temporário",
  eventos: "Eventos",
  banho: "Banho",
  alimentacao: "Alimentação",
  limpeza: "Limpeza",
  socializacao: "Socialização",
  fotografia: "Fotografia",
  marketing: "Marketing",
  administrativo: "Administrativo",
};

type VolunteerStore = {
  volunteers: Array<Record<string, unknown>>;
  availability: Array<Record<string, unknown>>;
  shifts: Array<Record<string, unknown>>;
  trainings: Array<Record<string, unknown>>;
  documents: Array<Record<string, unknown>>;
  attendance: Array<Record<string, unknown>>;
  evaluations: Array<Record<string, unknown>>;
};

const EMPTY_VOLUNTEER: VolunteerStore = {
  volunteers: [],
  availability: [],
  shifts: [],
  trainings: [],
  documents: [],
  attendance: [],
  evaluations: [],
};

export async function getNgoVoluntariadoModule(prisma: PrismaClient, ongId: string): Promise<ErpModuleResponse> {
  const store = await loadNgoErpStore(ongId, "voluntariado", EMPTY_VOLUNTEER);
  const supporters = await prisma.userFollow.count({ where: { followingId: ongId } });
  const activeVolunteers = store.volunteers.filter((v) => v.status !== "inativo").length;

  const volunteerRows = store.volunteers.map((v) => ({
    ...v,
    funcaoLabel: NGO_VOLUNTEER_FUNCTION_LABELS[String(v.funcao ?? "")] ?? v.funcao ?? "—",
  }));

  return {
    moduleId: "voluntariado",
    title: "Voluntariado",
    kpis: [
      kpi("volunteers", "Voluntários", store.volunteers.length),
      kpi("active", "Ativos", activeVolunteers),
      kpi("shifts", "Escalas", store.shifts.length),
      kpi("trainings", "Treinamentos", store.trainings.length),
      kpi("attendance", "Presenças", store.attendance.length),
      kpi("supporters", "Apoiadores", supporters),
    ],
    tables: [
      { id: "volunteers", label: "Voluntários", rows: volunteerRows },
      { id: "availability", label: "Disponibilidade", rows: store.availability },
      { id: "shifts", label: "Escala", rows: store.shifts },
      { id: "trainings", label: "Treinamentos", rows: store.trainings },
      { id: "documents", label: "Documentos", rows: store.documents },
      { id: "attendance", label: "Presença", rows: store.attendance },
      { id: "evaluations", label: "Avaliações", rows: store.evaluations },
      {
        id: "functions",
        label: "Funções disponíveis",
        rows: NGO_VOLUNTEER_FUNCTIONS.map((f) => ({ id: f, funcao: NGO_VOLUNTEER_FUNCTION_LABELS[f] })),
      },
    ],
    tabs: [
      { id: "volunteers", label: "Voluntários" },
      { id: "availability", label: "Disponibilidade" },
      { id: "shifts", label: "Escala" },
      { id: "trainings", label: "Treinamentos" },
      { id: "attendance", label: "Presença" },
      { id: "evaluations", label: "Avaliações" },
    ],
    quickActions: [{ label: "Apoiadores", href: "/ngo/supporters" }],
    disclaimer: store.volunteers.length === 0 ? "Cadastre voluntários via POST no módulo ERP." : undefined,
  };
}

export const NGO_PARTNER_TYPES = [
  "clinica",
  "petshop",
  "hospital",
  "fornecedor",
  "empresa",
  "influenciador",
  "juridico",
  "transporte",
  "eventos",
] as const;

export const NGO_PARTNER_TYPE_LABELS: Record<string, string> = {
  clinica: "Clínica veterinária",
  petshop: "Pet shop",
  hospital: "Hospital veterinário",
  fornecedor: "Fornecedor",
  empresa: "Empresa apoiadora",
  influenciador: "Influenciador",
  juridico: "Parceiro jurídico",
  transporte: "Transporte",
  eventos: "Eventos",
};

type PartnershipStore = {
  partners: Array<Record<string, unknown>>;
  contacts: Array<Record<string, unknown>>;
  contracts: Array<Record<string, unknown>>;
};

const EMPTY_PARTNERSHIPS: PartnershipStore = {
  partners: [],
  contacts: [],
  contracts: [],
};

export async function getNgoParceriasModule(prisma: PrismaClient, ongId: string): Promise<ErpModuleResponse> {
  const store = await loadNgoErpStore(ongId, "parcerias", EMPTY_PARTNERSHIPS);

  const partnerRows = store.partners.map((p) => ({
    id: p.id,
    parceiro: p.nome ?? p.name ?? "—",
    tipo: NGO_PARTNER_TYPE_LABELS[String(p.tipo ?? p.type ?? "")] ?? p.tipo ?? "—",
    contato: p.contato ?? p.email ?? "—",
    status: p.status ?? "ativo",
    beneficio: p.beneficio ?? p.benefit ?? "—",
    contrato: p.contrato ?? p.contractUrl ?? "—",
    responsavel: p.responsavel ?? "—",
    historico: p.historico ?? p.history ?? "—",
    atualizado: p.updatedAt ?? p.createdAt ?? "—",
  }));

  const active = partnerRows.filter((p) => p.status === "ativo").length;

  return {
    moduleId: "parcerias",
    title: "Parcerias",
    kpis: [
      kpi("partners", "Parceiros", partnerRows.length),
      kpi("active", "Ativas", active),
      kpi("contacts", "Contatos registrados", store.contacts.length),
      kpi("contracts", "Contratos", store.contracts.length),
    ],
    tables: [
      { id: "partners", label: "Parcerias", rows: partnerRows },
      { id: "contacts", label: "Histórico de contatos", rows: store.contacts },
      { id: "contracts", label: "Contratos", rows: store.contracts },
      {
        id: "types",
        label: "Tipos de parceiro",
        rows: NGO_PARTNER_TYPES.map((t) => ({ id: t, tipo: NGO_PARTNER_TYPE_LABELS[t] })),
      },
    ],
    tabs: [
      { id: "partners", label: "Parceiros" },
      { id: "contacts", label: "Contatos" },
      { id: "contracts", label: "Contratos" },
    ],
    disclaimer:
      partnerRows.length === 0
        ? "Use POST /api/ong/erp/parcerias para criar parcerias. Ações sensíveis são auditadas."
        : undefined,
  };
}
