import type { PrismaClient } from "@prisma/client";
import type { ErpModuleResponse } from "@/lib/admin/erp/types";
import { kpi } from "./types";
import { loadPartnerErpStore, loadPartnerAuditTrail } from "./store";
import {
  buildIntegrationRows,
  EMPTY_INTEGRATIONS_STORE,
  integrationEnvironment,
  PARTNER_INTEGRATION_CATALOG,
} from "@/lib/integrations/erp-integration-catalog";

type VetStore = {
  surgeries: Array<Record<string, unknown>>;
  hospitalizations: Array<Record<string, unknown>>;
  prescriptions: Array<Record<string, unknown>>;
};

const EMPTY_VET: VetStore = {
  surgeries: [],
  hospitalizations: [],
  prescriptions: [],
};

type LojaStore = {
  queues: Array<Record<string, unknown>>;
  pdvSessions: Array<Record<string, unknown>>;
  labels: Array<Record<string, unknown>>;
};

const EMPTY_LOJA: LojaStore = {
  queues: [],
  pdvSessions: [],
  labels: [],
};

type LabStore = {
  tests: Array<Record<string, unknown>>;
  homologation: Array<Record<string, unknown>>;
  abTests: Array<Record<string, unknown>>;
};

const EMPTY_LAB: LabStore = {
  tests: [],
  homologation: [],
  abTests: [],
};

async function partnerPetIds(prisma: PrismaClient, partnerId: string): Promise<string[]> {
  const appointments = await prisma.appointment.findMany({
    where: { partnerId },
    select: { petId: true },
    distinct: ["petId"],
    take: 200,
  });
  return appointments.map((a) => a.petId);
}

export async function getPartnerVeterinarioModule(prisma: PrismaClient, partnerId: string): Promise<ErpModuleResponse> {
  const store = await loadPartnerErpStore(partnerId, "veterinario", EMPTY_VET);
  const petIds = await partnerPetIds(prisma, partnerId);

  const [appointments, records, exams, medications, vaccinations, consultations] = await Promise.all([
    prisma.appointment.findMany({
      where: { partnerId },
      orderBy: { scheduledAt: "desc" },
      take: 20,
      include: { pet: { select: { name: true } }, user: { select: { name: true } } },
    }),
    petIds.length
      ? prisma.medicalRecord.findMany({
          where: { OR: [{ authorId: partnerId }, { petId: { in: petIds } }] },
          orderBy: { recordDate: "desc" },
          take: 20,
          include: { pet: { select: { name: true } } },
        })
      : Promise.resolve([]),
    petIds.length
      ? prisma.exam.findMany({ where: { petId: { in: petIds } }, orderBy: { date: "desc" }, take: 15 })
      : Promise.resolve([]),
    petIds.length
      ? prisma.medication.findMany({ where: { petId: { in: petIds } }, take: 15 })
      : Promise.resolve([]),
    petIds.length
      ? prisma.vaccination.findMany({ where: { petId: { in: petIds } }, orderBy: { date: "desc" }, take: 15 })
      : Promise.resolve([]),
    petIds.length
      ? prisma.consultation.findMany({
          where: { petId: { in: petIds } },
          orderBy: { date: "desc" },
          take: 15,
          include: { pet: { select: { name: true } } },
        })
      : Promise.resolve([]),
  ]);

  const prescriptionRows =
    store.prescriptions.length > 0
      ? store.prescriptions
      : consultations
          .filter((c) => c.prescription)
          .map((c) => ({
            id: c.id,
            pet: c.pet.name,
            prescricao: c.prescription,
            data: c.date.toISOString(),
          }));

  return {
    moduleId: "veterinario",
    title: "Veterinário",
    kpis: [
      kpi("records", "Prontuários", records.length),
      kpi("consultations", "Consultas", appointments.length),
      kpi("exams", "Exames", exams.length),
      kpi("medications", "Medicamentos", medications.length),
      kpi("surgeries", "Cirurgias", store.surgeries.length),
      kpi("vaccines", "Vacinas", vaccinations.length),
      kpi("hospitalizations", "Internações", store.hospitalizations.length),
      kpi("prescriptions", "Prescrições", prescriptionRows.length),
    ],
    tables: [
      {
        id: "records",
        label: "Prontuário",
        rows: records.map((r) => ({
          id: r.id,
          pet: r.pet.name,
          tipo: r.type,
          titulo: r.title,
          veterinario: r.veterinarianName ?? "—",
          data: r.recordDate.toISOString(),
        })),
      },
      {
        id: "consultations",
        label: "Consultas",
        rows: appointments.map((a) => ({
          id: a.id,
          pet: a.pet.name,
          tutor: a.user?.name ?? "—",
          status: a.status,
          data: a.scheduledAt.toISOString(),
        })),
      },
      {
        id: "exams",
        label: "Exames",
        rows: exams.map((e) => ({
          id: e.id,
          tipo: e.type,
          resultado: e.result ?? "—",
          data: e.date.toISOString(),
        })),
      },
      {
        id: "medications",
        label: "Medicamentos",
        rows: medications.map((m) => ({
          id: m.id,
          nome: m.name,
          dosagem: m.dosage ?? "—",
          frequencia: m.frequency ?? "—",
        })),
      },
      { id: "surgeries", label: "Cirurgias", rows: store.surgeries },
      {
        id: "vaccines",
        label: "Vacinas",
        rows: vaccinations.map((v) => ({
          id: v.id,
          nome: v.name,
          lote: v.batch ?? "—",
          proxima: v.nextDue?.toISOString() ?? "—",
          data: v.date.toISOString(),
        })),
      },
      { id: "hospitalizations", label: "Internações", rows: store.hospitalizations },
      { id: "prescriptions", label: "Prescrições", rows: prescriptionRows },
    ],
    tabs: [
      { id: "records", label: "Prontuário" },
      { id: "consultations", label: "Consultas" },
      { id: "exams", label: "Exames" },
      { id: "medications", label: "Medicamentos" },
      { id: "surgeries", label: "Cirurgias" },
      { id: "vaccines", label: "Vacinas" },
      { id: "hospitalizations", label: "Internações" },
      { id: "prescriptions", label: "Prescrições" },
    ],
    disclaimer: petIds.length === 0 ? "Agendamentos com pets geram prontuário e histórico clínico." : undefined,
  };
}

export async function getPartnerLojaModule(prisma: PrismaClient, partnerId: string): Promise<ErpModuleResponse> {
  const store = await loadPartnerErpStore(partnerId, "loja", EMPTY_LOJA);
  const curStart = new Date();
  curStart.setDate(1);
  curStart.setHours(0, 0, 0, 0);

  const [orders, pendingAppts, products, refunds, inventoryLogs] = await Promise.all([
    prisma.order.findMany({
      where: { partnerId, createdAt: { gte: curStart } },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: { id: true, total: true, status: true, paymentMethod: true, createdAt: true },
    }),
    prisma.appointment.findMany({
      where: { partnerId, status: "PENDING" },
      orderBy: { scheduledAt: "asc" },
      take: 15,
      include: { user: { select: { name: true } }, pet: { select: { name: true } } },
    }),
    prisma.product.findMany({
      where: { sellerId: partnerId, deletedAt: null },
      select: { id: true, name: true, stock: true, barcode: true, sku: true, price: true },
      take: 25,
    }),
    prisma.refund.findMany({
      where: { order: { partnerId } },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: { id: true, amount: true, status: true, reason: true, createdAt: true },
    }),
    prisma.inventoryLog.findMany({
      where: { partnerId },
      orderBy: { createdAt: "desc" },
      take: 15,
      include: { product: { select: { name: true } } },
    }),
  ]);

  const queueRows =
    store.queues.length > 0
      ? store.queues
      : pendingAppts.map((a, i) => ({
          id: a.id,
          posicao: i + 1,
          cliente: a.user?.name ?? "—",
          pet: a.pet.name,
          horario: a.scheduledAt.toISOString(),
        }));

  const caixaTotal = orders.reduce((s, o) => s + o.total, 0);

  return {
    moduleId: "loja",
    title: "Loja Física",
    kpis: [
      kpi("cashier", "Caixa (mês)", `R$ ${caixaTotal.toFixed(2)}`),
      kpi("pdv", "PDV (pedidos)", orders.length),
      kpi("queues", "Fila", queueRows.length),
      kpi("service", "Atendimento", pendingAppts.length),
      kpi("stock", "Estoque (SKUs)", products.length),
      kpi("labels", "Etiquetas", store.labels.length),
      kpi("barcodes", "Códigos de barras", products.filter((p) => p.barcode).length),
      kpi("returns", "Devoluções", refunds.length, { variant: refunds.length > 0 ? "warning" : "default" }),
    ],
    tables: [
      {
        id: "cashier",
        label: "Caixa",
        rows: [{ id: "month", total: caixaTotal, pedidos: orders.length }],
      },
      {
        id: "pdv",
        label: "PDV",
        rows: orders.map((o) => ({
          id: o.id,
          total: o.total,
          pagamento: o.paymentMethod,
          status: o.status,
          data: o.createdAt.toISOString(),
        })),
      },
      { id: "queues", label: "Filas", rows: queueRows },
      {
        id: "service",
        label: "Atendimento",
        rows: pendingAppts.map((a) => ({
          id: a.id,
          cliente: a.user?.name ?? "—",
          pet: a.pet.name,
          status: a.status,
          horario: a.scheduledAt.toISOString(),
        })),
      },
      {
        id: "stock",
        label: "Estoque",
        rows: products.map((p) => ({
          id: p.id,
          nome: p.name,
          estoque: p.stock,
          preco: p.price,
          sku: p.sku ?? "—",
        })),
      },
      { id: "labels", label: "Etiquetas", rows: store.labels },
      {
        id: "barcodes",
        label: "Códigos de barras",
        rows: products
          .filter((p) => p.barcode || p.sku)
          .map((p) => ({ id: p.id, nome: p.name, barcode: p.barcode ?? "—", sku: p.sku ?? "—" })),
      },
      {
        id: "returns",
        label: "Devoluções",
        rows: refunds.map((r) => ({
          id: r.id,
          valor: r.amount,
          status: r.status,
          motivo: r.reason ?? "—",
          data: r.createdAt.toISOString(),
        })),
      },
      {
        id: "inventory",
        label: "Movimentações estoque",
        rows: inventoryLogs.map((l) => ({
          id: l.id,
          produto: l.product.name,
          delta: l.delta,
          saldo: l.stockAfter,
          motivo: l.reason ?? "—",
          data: l.createdAt.toISOString(),
        })),
      },
    ],
    tabs: [
      { id: "cashier", label: "Caixa" },
      { id: "pdv", label: "PDV" },
      { id: "queues", label: "Filas" },
      { id: "service", label: "Atendimento" },
      { id: "stock", label: "Estoque" },
      { id: "labels", label: "Etiquetas" },
      { id: "barcodes", label: "Códigos de barras" },
      { id: "returns", label: "Devoluções" },
    ],
  };
}

export async function getPartnerIntegracoesModule(prisma: PrismaClient, partnerId: string): Promise<ErpModuleResponse> {
  const store = await loadPartnerErpStore(partnerId, "integracoes", {
    configs: [] as Array<Record<string, unknown>>,
    connections: {} as Record<string, unknown>,
    logs: [] as Array<Record<string, unknown>>,
  });
  const integrationStore = {
    connections: (store.connections as typeof EMPTY_INTEGRATIONS_STORE.connections) ?? {},
    logs: store.logs ?? [],
  };
  const integrationRows = buildIntegrationRows(PARTNER_INTEGRATION_CATALOG, integrationStore);
  const active = integrationRows.filter((r) => r.ativo).length;
  const audit = await loadPartnerAuditTrail(partnerId, "integracoes", 8);

  return {
    moduleId: "integracoes",
    title: "Integrações",
    kpis: [
      kpi("total", "Integrações", integrationRows.length),
      kpi("active", "Ativas", active),
      kpi("pending", "Não configuradas", integrationRows.length - integrationRows.filter((r) => r.configurado).length, {
        variant: active < integrationRows.length ? "warning" : "success",
      }),
      kpi("env", "Ambiente", integrationEnvironment()),
    ],
    tables: [
      { id: "integrations", label: "Provedores", rows: integrationRows },
      { id: "configs", label: "Configurações parceiro", rows: store.configs },
      { id: "logs", label: "Logs", rows: integrationStore.logs.slice(-20).reverse() },
      { id: "webhooks", label: "Webhooks", rows: integrationRows.filter((r) => r.webhook !== "N/A") },
      { id: "audit", label: "Auditoria", rows: audit },
    ],
    tabs: [
      { id: "integrations", label: "Integrações" },
      { id: "configs", label: "Configurações" },
      { id: "logs", label: "Logs" },
      { id: "webhooks", label: "Webhooks" },
    ],
    items: integrationRows.map((r) => ({ id: r.id as string, nome: r.integracao as string, status: r.status as string })),
    disclaimer:
      "Status baseado em variáveis de ambiente da plataforma. Tokens mascarados. ERP, PDV, estoque e webhooks personalizados requerem credenciais no servidor.",
  };
}

export async function getPartnerSuporteModule(prisma: PrismaClient, partnerId: string): Promise<ErpModuleResponse> {
  const [tickets, audit] = await Promise.all([
    prisma.supportTicket.findMany({
      where: { OR: [{ requesterId: partnerId }, { assigneeId: partnerId }] },
      orderBy: { updatedAt: "desc" },
      take: 20,
      select: {
        id: true,
        number: true,
        subject: true,
        status: true,
        priority: true,
        category: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
    loadPartnerAuditTrail(partnerId, "suporte", 10),
  ]);

  const open = tickets.filter((t) => t.status === "OPEN" || t.status === "IN_PROGRESS").length;

  return {
    moduleId: "suporte",
    title: "Suporte",
    kpis: [
      kpi("tickets", "Chamados", tickets.length),
      kpi("open", "Abertos", open, { variant: open > 0 ? "warning" : "default" }),
      kpi("audits", "Auditorias", audit.length),
    ],
    tables: [
      {
        id: "tickets",
        label: "Chamados",
        rows: tickets.map((t) => ({
          id: t.id,
          numero: t.number,
          assunto: t.subject,
          status: t.status,
          prioridade: t.priority,
          categoria: t.category,
          atualizado: t.updatedAt.toISOString(),
        })),
      },
      {
        id: "audit",
        label: "Auditoria",
        rows: audit,
      },
    ],
    quickActions: [{ label: "Mensagens", href: "/partner/messages" }],
  };
}

export async function getPartnerLaboratorioModule(prisma: PrismaClient, partnerId: string): Promise<ErpModuleResponse> {
  const store = await loadPartnerErpStore(partnerId, "laboratorio", EMPTY_LAB);

  const [flags, aiLogs, auditLogs, workflows] = await Promise.all([
    prisma.featureFlag.findMany({
      where: {
        OR: [
          { personaScope: "PARTNER" },
          { moduleKey: { startsWith: "partner" } },
          { key: { startsWith: "partner." } },
        ],
      },
      orderBy: { updatedAt: "desc" },
      take: 25,
      select: { id: true, key: true, name: true, enabled: true, rolloutPct: true, moduleKey: true },
    }),
    prisma.aILog.findMany({
      where: { userId: partnerId },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: { id: true, agentId: true, errorCode: true, durationMs: true, createdAt: true },
    }),
    prisma.auditLog.findMany({
      where: { module: { startsWith: "partner-erp:" } },
      orderBy: { createdAt: "desc" },
      take: 30,
    }),
    prisma.workflowInstance.findMany({
      where: { ownerId: partnerId },
      orderBy: { startedAt: "desc" },
      take: 5,
      select: { id: true, status: true, startedAt: true },
    }),
  ]);

  const partnerAudits = auditLogs
    .filter((l) => {
      const meta = l.metadata as { partnerId?: string } | null;
      return !meta?.partnerId || meta.partnerId === partnerId;
    })
    .slice(0, 15);

  const abRows =
    store.abTests.length > 0
      ? store.abTests
      : flags
          .filter((f) => f.rolloutPct < 100)
          .map((f) => ({
            id: f.id,
            experimento: f.name,
            chave: f.key,
            rollout: `${f.rolloutPct}%`,
            ativo: f.enabled,
          }));

  return {
    moduleId: "laboratorio",
    title: "Laboratório",
    kpis: [
      kpi("flags", "Feature flags", flags.length),
      kpi("tests", "Testes", store.tests.length),
      kpi("homologation", "Homologação", store.homologation.length),
      kpi("ab", "A/B", abRows.length),
      kpi("monitoring", "Monitoramento", partnerAudits.length + aiLogs.length),
    ],
    tables: [
      {
        id: "flags",
        label: "Feature flags",
        rows: flags.map((f) => ({
          id: f.id,
          chave: f.key,
          nome: f.name,
          ativo: f.enabled,
          rollout: f.rolloutPct,
          modulo: f.moduleKey ?? "—",
        })),
      },
      { id: "tests", label: "Testes", rows: store.tests },
      { id: "homologation", label: "Homologação", rows: store.homologation },
      { id: "ab", label: "A/B", rows: abRows },
      {
        id: "monitoring",
        label: "Monitoramento",
        rows: [
          ...partnerAudits.map((a) => ({
            id: a.id,
            tipo: "audit",
            modulo: a.module,
            acao: a.action,
            data: a.createdAt.toISOString(),
          })),
          ...aiLogs.map((l) => ({
            id: l.id,
            tipo: "ia",
            agente: l.agentId,
            status: l.errorCode ? "erro" : "ok",
            data: l.createdAt.toISOString(),
          })),
          ...workflows.map((w) => ({
            id: w.id,
            tipo: "workflow",
            status: w.status,
            data: w.startedAt.toISOString(),
          })),
        ],
      },
    ],
    tabs: [
      { id: "flags", label: "Feature flags" },
      { id: "tests", label: "Testes" },
      { id: "homologation", label: "Homologação" },
      { id: "ab", label: "A/B" },
      { id: "monitoring", label: "Monitoramento" },
    ],
    disclaimer: "Ambiente de experimentação — alterações críticas exigem permissão configure.",
  };
}
