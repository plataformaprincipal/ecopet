import type { PrismaClient } from "@prisma/client";
import type { ErpModuleResponse } from "@/lib/admin/erp/types";
import { kpi } from "./types";
import {
  loadPartnerErpStore,
  loadPartnerAuditTrail,
} from "./store";
import {
  defaultPartnerPermissionMatrix,
  PARTNER_ERP_ROLES,
  PARTNER_ERP_RESOURCES,
  PARTNER_PERMISSION_ACTIONS,
  type PartnerRoleAssignment,
} from "./permissions";
import { PARTNER_ERP_RESOURCE_LABELS } from "./module-registry";

type RhStore = {
  employees: Array<Record<string, unknown>>;
  departments: Array<Record<string, unknown>>;
  roles: Array<Record<string, unknown>>;
  vacations: Array<Record<string, unknown>>;
  trainings: Array<Record<string, unknown>>;
  evaluations: Array<Record<string, unknown>>;
  goals: Array<Record<string, unknown>>;
  documents: Array<Record<string, unknown>>;
  accesses: Array<Record<string, unknown>>;
};

const EMPTY_RH: RhStore = {
  employees: [],
  departments: [],
  roles: [],
  vacations: [],
  trainings: [],
  evaluations: [],
  goals: [],
  documents: [],
  accesses: [],
};

export async function getPartnerRhModule(prisma: PrismaClient, partnerId: string): Promise<ErpModuleResponse> {
  const store = await loadPartnerErpStore(partnerId, "rh", EMPTY_RH);
  const profile = await prisma.partnerProfile.findUnique({
    where: { userId: partnerId },
    select: { responsibleName: true, verificationDocuments: true },
  });

  const docsFromProfile = profile?.verificationDocuments
    ? [{ id: "profile-docs", nome: "Documentos de verificação", origem: "perfil", status: "registrado" }]
    : [];

  const documents = [...store.documents, ...docsFromProfile];
  const audit = await loadPartnerAuditTrail(partnerId, "rh");

  return {
    moduleId: "rh",
    title: "Recursos Humanos",
    kpis: [
      kpi("employees", "Colaboradores", store.employees.length),
      kpi("departments", "Departamentos", store.departments.length),
      kpi("vacations", "Férias programadas", store.vacations.length),
      kpi("trainings", "Treinamentos", store.trainings.length),
      kpi("evaluations", "Avaliações", store.evaluations.length),
      kpi("goals", "Metas", store.goals.length),
    ],
    tables: [
      { id: "employees", label: "Colaboradores", rows: store.employees },
      { id: "departments", label: "Departamentos", rows: store.departments },
      { id: "roles", label: "Cargos", rows: store.roles },
      { id: "vacations", label: "Férias", rows: store.vacations },
      { id: "trainings", label: "Treinamentos", rows: store.trainings },
      { id: "evaluations", label: "Avaliações", rows: store.evaluations },
      { id: "goals", label: "Metas", rows: store.goals },
      { id: "documents", label: "Documentos", rows: documents },
      { id: "accesses", label: "Acessos", rows: store.accesses },
    ],
    tabs: [
      { id: "employees", label: "Colaboradores" },
      { id: "departments", label: "Departamentos" },
      { id: "vacations", label: "Férias" },
      { id: "trainings", label: "Treinamentos" },
      { id: "evaluations", label: "Avaliações" },
      { id: "documents", label: "Documentos" },
    ],
    timeline: audit.map((a) => ({
      id: a.id,
      date: a.createdAt,
      title: `${a.action} · ${a.resource}`,
      description: a.observation ?? undefined,
      actor: a.actor,
    })),
    disclaimer: store.employees.length === 0 ? "Cadastre colaboradores para ativar a gestão de RH." : undefined,
  };
}

export async function getPartnerJuridicoModule(prisma: PrismaClient, partnerId: string): Promise<ErpModuleResponse> {
  const store = await loadPartnerErpStore(partnerId, "juridico", { contracts: [] as Record<string, unknown>[] });
  const [lgpd, notifications, profile, audit] = await Promise.all([
    prisma.lgpdRequest.findMany({ where: { userId: partnerId }, orderBy: { createdAt: "desc" }, take: 10 }),
    prisma.notification.findMany({ where: { userId: partnerId }, orderBy: { createdAt: "desc" }, take: 10 }),
    prisma.partnerProfile.findUnique({
      where: { userId: partnerId },
      select: { legalName: true, cnpj: true, financialDetails: true, operationDetails: true },
    }),
    loadPartnerAuditTrail(partnerId, "juridico"),
  ]);

  const contracts = [
    ...store.contracts,
    ...(profile
      ? [{ id: "partner-contract", titulo: "Contrato comercial EcoPet", parte: profile.legalName, status: "ativo" }]
      : []),
  ];

  return {
    moduleId: "juridico",
    title: "Jurídico",
    kpis: [
      kpi("contracts", "Contratos", contracts.length),
      kpi("lgpd", "Solicitações LGPD", lgpd.length),
      kpi("notifications", "Notificações", notifications.length),
      kpi("compliance", "Eventos compliance", audit.length),
    ],
    tables: [
      { id: "contracts", label: "Contratos", rows: contracts },
      {
        id: "lgpd",
        label: "LGPD",
        rows: lgpd.map((r) => ({ id: r.id, tipo: r.type, status: r.status, criado: r.createdAt.toISOString() })),
      },
      {
        id: "terms",
        label: "Termos",
        rows: [
          { id: "terms", titulo: "Termos do Parceiro", href: "/legal/parceiro/termos" },
          { id: "privacy", titulo: "Privacidade do Parceiro", href: "/legal/parceiro/privacidade" },
        ],
      },
      {
        id: "notifications",
        label: "Notificações jurídicas",
        rows: notifications.map((n) => ({ id: n.id, titulo: n.title, tipo: n.type, data: n.createdAt.toISOString() })),
      },
    ],
    tabs: [
      { id: "contracts", label: "Contratos" },
      { id: "lgpd", label: "LGPD" },
      { id: "terms", label: "Termos" },
      { id: "compliance", label: "Compliance" },
    ],
    timeline: audit.map((a) => ({
      id: a.id,
      date: a.createdAt,
      title: a.resource,
      description: a.observation ?? undefined,
      actor: a.actor,
    })),
  };
}

export async function getPartnerAdministrativoModule(prisma: PrismaClient, partnerId: string): Promise<ErpModuleResponse> {
  const store = await loadPartnerErpStore(partnerId, "administrativo", {
    tasks: [] as Record<string, unknown>[],
    communications: [] as Record<string, unknown>[],
  });

  const [approvals, workflows, availability, appointments, audit] = await Promise.all([
    prisma.approvalRequest.findMany({
      where: { requesterId: partnerId },
      orderBy: { createdAt: "desc" },
      take: 15,
    }),
    prisma.workflowInstance.findMany({
      where: { ownerId: partnerId },
      orderBy: { startedAt: "desc" },
      take: 10,
      include: { definition: { select: { name: true } } },
    }),
    prisma.partnerAvailability.findMany({ where: { partnerId }, take: 20 }),
    prisma.appointment.findMany({
      where: { partnerId, scheduledAt: { gte: new Date() } },
      orderBy: { scheduledAt: "asc" },
      take: 10,
      include: { service: { select: { name: true } } },
    }),
    loadPartnerAuditTrail(partnerId, "administrativo"),
  ]);

  const tasks = [
    ...store.tasks,
    ...approvals.map((a) => ({
      id: a.id,
      titulo: `${a.type} · ${a.entityType}`,
      status: a.status,
      criado: a.createdAt.toISOString(),
    })),
  ];

  return {
    moduleId: "administrativo",
    title: "Administrativo",
    kpis: [
      kpi("tasks", "Tarefas", tasks.length),
      kpi("processes", "Processos", workflows.length),
      kpi("calendar", "Agenda", appointments.length),
      kpi("communications", "Comunicados", store.communications.length),
    ],
    tables: [
      { id: "tasks", label: "Tarefas", rows: tasks },
      {
        id: "processes",
        label: "Processos",
        rows: workflows.map((w) => ({
          id: w.id,
          nome: w.definition.name,
          status: w.status,
          inicio: w.startedAt.toISOString(),
        })),
      },
      {
        id: "calendar",
        label: "Calendário",
        rows: [
          ...availability.map((a) => ({
            id: a.id,
            tipo: "disponibilidade",
            dia: a.weekday,
            inicio: a.startTime,
            fim: a.endTime,
          })),
          ...appointments.map((a) => ({
            id: a.id,
            tipo: "agendamento",
            servico: a.service?.name ?? "—",
            data: a.scheduledAt.toISOString(),
          })),
        ],
      },
      { id: "communications", label: "Comunicados", rows: store.communications },
    ],
    tabs: [
      { id: "tasks", label: "Tarefas" },
      { id: "processes", label: "Processos" },
      { id: "documents", label: "Documentos" },
      { id: "calendar", label: "Calendário" },
    ],
    timeline: audit.map((a) => ({
      id: a.id,
      date: a.createdAt,
      title: a.resource,
      actor: a.actor,
    })),
  };
}

export async function getPartnerComprasModule(prisma: PrismaClient, partnerId: string): Promise<ErpModuleResponse> {
  const store = await loadPartnerErpStore(partnerId, "compras", {
    requests: [] as Record<string, unknown>[],
    quotes: [] as Record<string, unknown>[],
  });

  const [purchaseOrders, approvals, audit] = await Promise.all([
    prisma.order.findMany({
      where: { userId: partnerId },
      orderBy: { createdAt: "desc" },
      take: 20,
      include: { items: true },
    }),
    prisma.approvalRequest.findMany({
      where: { requesterId: partnerId },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
    loadPartnerAuditTrail(partnerId, "compras"),
  ]);

  const requests = [
    ...store.requests,
    ...approvals
      .filter((a) => a.status === "PENDING")
      .map((a) => ({ id: a.id, titulo: a.type, status: a.status, criado: a.createdAt.toISOString() })),
  ];

  return {
    moduleId: "compras",
    title: "Compras",
    kpis: [
      kpi("requests", "Solicitações", requests.length),
      kpi("orders", "Pedidos de compra", purchaseOrders.length),
      kpi("quotes", "Cotações", store.quotes.length),
      kpi("approvals", "Aprovações pendentes", approvals.filter((a) => a.status === "PENDING").length, { variant: "warning" }),
    ],
    tables: [
      { id: "requests", label: "Solicitações", rows: requests },
      {
        id: "orders",
        label: "Pedidos",
        rows: purchaseOrders.map((o) => ({
          id: o.id,
          total: o.total,
          status: o.status,
          itens: o.items.length,
          data: o.createdAt.toISOString(),
        })),
      },
      { id: "quotes", label: "Cotações", rows: store.quotes },
      {
        id: "approvals",
        label: "Aprovações",
        rows: approvals.map((a) => ({
          id: a.id,
          tipo: a.type,
          status: a.status,
          entidade: a.entityType,
          data: a.createdAt.toISOString(),
        })),
      },
    ],
    tabs: [
      { id: "requests", label: "Solicitações" },
      { id: "orders", label: "Pedidos" },
      { id: "quotes", label: "Cotações" },
      { id: "approvals", label: "Aprovações" },
    ],
    timeline: audit.map((a) => ({ id: a.id, date: a.createdAt, title: a.resource, actor: a.actor })),
  };
}

export async function getPartnerFornecedoresModule(prisma: PrismaClient, partnerId: string): Promise<ErpModuleResponse> {
  const store = await loadPartnerErpStore(partnerId, "fornecedores", {
    suppliers: [] as Record<string, unknown>[],
  });

  const purchaseItems = await prisma.order.findMany({
    where: { userId: partnerId },
    include: {
      items: {
        include: {
          product: { select: { sellerId: true, name: true, seller: { select: { id: true, name: true, partnerProfile: { select: { businessName: true } } } } } },
        },
      },
    },
    take: 30,
  });

  const supplierMap = new Map<string, { id: string; nome: string; pedidos: number; produtos: Set<string> }>();
  for (const order of purchaseItems) {
    for (const item of order.items) {
      const seller = item.product?.seller;
      if (!seller) continue;
      const name = seller.partnerProfile?.businessName ?? seller.name ?? "Fornecedor";
      const prev = supplierMap.get(seller.id);
      if (prev) {
        prev.pedidos += 1;
        if (item.product?.name) prev.produtos.add(item.product.name);
      } else {
        supplierMap.set(seller.id, { id: seller.id, nome: name, pedidos: 1, produtos: new Set(item.product?.name ? [item.product.name] : []) });
      }
    }
  }

  const derived = [...supplierMap.values()].map((s) => ({
    id: s.id,
    nome: s.nome,
    pedidos: s.pedidos,
    produtos: s.produtos.size,
    origem: "histórico de compras",
  }));

  const suppliers = [...store.suppliers, ...derived];

  return {
    moduleId: "fornecedores",
    title: "Fornecedores",
    kpis: [
      kpi("suppliers", "Fornecedores", suppliers.length),
      kpi("contracts", "Contratos", store.suppliers.filter((s) => s.tipo === "contrato").length),
      kpi("evaluations", "Avaliações", store.suppliers.filter((s) => s.avaliacao).length),
    ],
    tables: [
      { id: "suppliers", label: "Cadastro", rows: suppliers },
      { id: "history", label: "Histórico", rows: derived },
      { id: "contracts", label: "Contratos", rows: store.suppliers.filter((s) => s.tipo === "contrato") },
      { id: "products", label: "Produtos fornecidos", rows: derived.map((s) => ({ fornecedor: s.nome, produtos: s.produtos })) },
    ],
    tabs: [
      { id: "register", label: "Cadastro" },
      { id: "evaluation", label: "Avaliação" },
      { id: "history", label: "Histórico" },
      { id: "contracts", label: "Contratos" },
    ],
    disclaimer: suppliers.length === 0 ? "Nenhum fornecedor registrado. Compras na plataforma geram histórico automaticamente." : undefined,
  };
}

export async function getPartnerPermissoesModule(prisma: PrismaClient, partnerId: string): Promise<ErpModuleResponse> {
  const store = await loadPartnerErpStore(partnerId, "permissoes", {
    matrix: defaultPartnerPermissionMatrix(),
    assignments: [] as PartnerRoleAssignment[],
  });

  const owner = await prisma.user.findUnique({
    where: { id: partnerId },
    select: { id: true, name: true, email: true },
  });

  const assignments: PartnerRoleAssignment[] = [
    {
      id: "owner",
      userId: partnerId,
      userName: owner?.name ?? owner?.email ?? "Proprietário",
      role: "SUPER_ADMIN",
      createdAt: new Date().toISOString(),
    },
    ...store.assignments,
  ];

  const audit = await loadPartnerAuditTrail(partnerId, "permissoes");

  const matrixRows = PARTNER_ERP_ROLES.flatMap((role) =>
    PARTNER_PERMISSION_ACTIONS.map((action) => ({
      papel: role,
      acao: action,
      recursos: Object.entries(store.matrix[role] ?? {})
        .filter(([, perms]) => perms[action])
        .map(([res]) => res)
        .join(", ") || "—",
    }))
  );

  const moduleMatrixRows = PARTNER_ERP_RESOURCES.flatMap((resource) =>
    PARTNER_PERMISSION_ACTIONS.map((action) => ({
      id: `${resource}-${action}`,
      modulo: PARTNER_ERP_RESOURCE_LABELS[resource],
      resource,
      acao: action,
      papeis: PARTNER_ERP_ROLES.filter((role) => store.matrix[role]?.[resource]?.[action]).join(", ") || "—",
    }))
  );

  return {
    moduleId: "permissoes",
    title: "Permissões",
    kpis: [
      kpi("roles", "Papéis", PARTNER_ERP_ROLES.length),
      kpi("assignments", "Usuários atribuídos", assignments.length),
      kpi("actions", "Ações controladas", PARTNER_PERMISSION_ACTIONS.length),
      kpi("resources", "Módulos", PARTNER_ERP_RESOURCES.length),
      kpi("audits", "Auditorias", audit.length),
    ],
    tables: [
      { id: "assignments", label: "Atribuições de papel", rows: assignments },
      { id: "matrix", label: "Matriz por papel", rows: matrixRows },
      { id: "modules", label: "Matriz por módulo e ação", rows: moduleMatrixRows },
    ],
    tabs: PARTNER_ERP_ROLES.map((r) => ({ id: r.toLowerCase(), label: r })),
    permissionMatrix: store.matrix,
    permissionRoles: PARTNER_ERP_ROLES,
    permissionActions: PARTNER_PERMISSION_ACTIONS,
    permissionResources: PARTNER_ERP_RESOURCES,
    timeline: audit.map((a) => ({
      id: a.id,
      date: a.createdAt,
      title: `${a.action} · ${a.resource}`,
      description: a.observation ?? undefined,
      actor: a.actor,
      severity: a.action === "DELETE" ? ("warning" as const) : ("info" as const),
    })),
    disclaimer: "Alterações de permissão são registradas em AuditLog.",
  };
}
