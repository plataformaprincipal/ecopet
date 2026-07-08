import { AccountStatus, UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { GestorFilters } from "@/lib/gestor/gestor-filters";
import { dateRangeWhere, paginationArgs } from "@/lib/gestor/gestor-filters";
import { getIntegrationHealthReport } from "@/lib/integrations/health";

function startOfMonth(d = new Date()) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function startOfPrevMonth(d = new Date()) {
  return new Date(d.getFullYear(), d.getMonth() - 1, 1);
}

/** Dashboard executivo /admin — métricas e tabelas reais. */
export async function getAdminExecutiveDashboard(_filters: GestorFilters) {
  const now = new Date();
  const monthStart = startOfMonth(now);
  const prevMonthStart = startOfPrevMonth(now);
  const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

  const paidStatuses = ["PAID", "COMPLETED", "DELIVERED", "SHIPPED", "CONFIRMED"] as const;
  const pendingStatuses = ["PENDING", "PENDING_CONFIRMATION", "PROCESSING", "PREPARING"] as const;

  const [
    totalUsers,
    activeClients,
    activePartners,
    activeOngs,
    pendingApprovals,
    productsActive,
    servicesActive,
    ordersTotal,
    ordersPaid,
    ordersPending,
    revenueTotal,
    revenueMonth,
    revenuePrevMonth,
    revenuePending,
    openTickets,
    openReports,
    recentUsers,
    recentOrders,
    pendingPartners,
    recentReports,
    recentAudit,
    criticalLogs,
    aiCostMonth,
    paymentFailuresMonth,
    integrationErrors,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { role: UserRole.CLIENT, accountStatus: AccountStatus.ACTIVE } }),
    prisma.user.count({ where: { role: UserRole.PARTNER, accountStatus: AccountStatus.ACTIVE } }),
    prisma.user.count({ where: { role: UserRole.ONG, accountStatus: AccountStatus.ACTIVE } }),
    prisma.user.count({
      where: {
        accountStatus: AccountStatus.PENDING,
        role: { in: [UserRole.PARTNER, UserRole.ONG] },
      },
    }),
    prisma.product.count({ where: { deletedAt: null, status: "ACTIVE" } }),
    prisma.service.count({ where: { deletedAt: null, isActive: true, status: "ACTIVE" } }),
    prisma.order.count(),
    prisma.order.count({ where: { status: { in: [...paidStatuses] } } }),
    prisma.order.count({ where: { status: { in: [...pendingStatuses] } } }),
    prisma.order.aggregate({ _sum: { total: true } }),
    prisma.order.aggregate({ where: { createdAt: { gte: monthStart } }, _sum: { total: true } }),
    prisma.order.aggregate({
      where: { createdAt: { gte: prevMonthStart, lte: prevMonthEnd } },
      _sum: { total: true },
    }),
    prisma.order.aggregate({
      where: { status: { in: [...pendingStatuses] } },
      _sum: { total: true },
    }),
    prisma.supportTicket.count({
      where: { status: { in: ["OPEN", "IN_PROGRESS", "WAITING", "WAITING_USER"] } },
    }),
    prisma.socialReport.count({ where: { status: "OPEN" } }),
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      select: { id: true, name: true, email: true, role: true, accountStatus: true, createdAt: true },
    }),
    prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      select: {
        id: true,
        total: true,
        status: true,
        createdAt: true,
        user: { select: { name: true, email: true } },
      },
    }),
    prisma.user.findMany({
      where: { role: UserRole.PARTNER, accountStatus: AccountStatus.PENDING },
      orderBy: { createdAt: "desc" },
      take: 8,
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        partnerProfile: { select: { businessName: true, city: true } },
      },
    }),
    prisma.socialReport.findMany({
      where: { status: "OPEN" },
      orderBy: { createdAt: "desc" },
      take: 8,
      select: { id: true, reason: true, status: true, createdAt: true, reporter: { select: { name: true } } },
    }),
    prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      select: {
        id: true,
        action: true,
        module: true,
        resource: true,
        observation: true,
        createdAt: true,
        actor: { select: { name: true, email: true } },
      },
    }),
    prisma.platformIntegrationLog.count({ where: { status: { in: ["ERROR", "FAILED"] } } }),
    prisma.aITokenUsage.aggregate({
      where: { usageDate: { gte: monthStart } },
      _sum: { estimatedCost: true },
    }),
    prisma.paymentEvent.count({
      where: {
        createdAt: { gte: monthStart },
        OR: [{ errorCode: { not: null } }, { status: { in: ["failed", "FAILED", "error", "ERROR"] } }],
      },
    }),
    prisma.platformIntegrationLog.count({
      where: { status: { in: ["ERROR", "FAILED"] }, createdAt: { gte: monthStart } },
    }),
  ]);

  const grossTotal = revenueTotal._sum.total ?? 0;
  const grossMonth = revenueMonth._sum.total ?? 0;
  const grossPrev = revenuePrevMonth._sum.total ?? 0;
  const avgTicket = ordersTotal > 0 ? grossTotal / ordersTotal : 0;
  const conversionRate = ordersTotal > 0 ? Math.round((ordersPaid / ordersTotal) * 1000) / 10 : 0;
  const growth =
    grossPrev > 0 ? Math.round(((grossMonth - grossPrev) / grossPrev) * 1000) / 10 : grossMonth > 0 ? 100 : 0;

  return {
    metrics: [
      { key: "revenue_total", label: "Receita total", value: Math.round(grossTotal * 100) / 100 },
      { key: "revenue_month", label: "Receita mensal", value: Math.round(grossMonth * 100) / 100 },
      { key: "revenue_pending", label: "Receita pendente", value: Math.round((revenuePending._sum.total ?? 0) * 100) / 100 },
      { key: "orders_total", label: "Pedidos totais", value: ordersTotal },
      { key: "orders_paid", label: "Pedidos pagos", value: ordersPaid },
      { key: "orders_pending", label: "Pedidos pendentes", value: ordersPending },
      { key: "users_total", label: "Usuários totais", value: totalUsers },
      { key: "clients_active", label: "Clientes ativos", value: activeClients },
      { key: "partners_active", label: "Parceiros ativos", value: activePartners },
      { key: "ongs_active", label: "ONGs ativas", value: activeOngs },
      { key: "pending_approvals", label: "Cadastros pendentes", value: pendingApprovals },
      { key: "tickets_open", label: "Tickets abertos", value: openTickets },
      { key: "reports_open", label: "Denúncias pendentes", value: openReports },
      { key: "products_active", label: "Produtos ativos", value: productsActive },
      { key: "services_active", label: "Serviços ativos", value: servicesActive },
      { key: "conversion_rate", label: "Taxa de conversão (%)", value: conversionRate },
      { key: "avg_ticket", label: "Ticket médio", value: Math.round(avgTicket * 100) / 100 },
      { key: "monthly_growth", label: "Crescimento mensal (%)", value: growth },
      { key: "critical_alerts", label: "Alertas críticos", value: criticalLogs + openReports },
      { key: "integration_errors", label: "Integrações com erro", value: integrationErrors, variant: integrationErrors > 0 ? "warning" : "default" },
      { key: "pending_actions", label: "Ações pendentes", value: pendingApprovals + openTickets },
      { key: "ai_cost", label: "Custo estimado IA", value: Math.round((aiCostMonth._sum.estimatedCost ?? 0) * 100) / 100 },
      { key: "payment_failures", label: "Falhas de pagamento", value: paymentFailuresMonth, variant: paymentFailuresMonth > 0 ? "warning" : "default" },
    ],
    quickActions: [
      { label: "Aprovar parceiros", href: "/admin/approvals" },
      { label: "Ver pedidos", href: "/admin/orders" },
      { label: "Ver denúncias", href: "/admin/social" },
      { label: "Configurações", href: "/admin/settings" },
      { label: "Comunicados", href: "/admin/marketing" },
      { label: "Logs críticos", href: "/admin/audit" },
    ],
    tables: [
      {
        id: "recent_users",
        label: "Últimos usuários cadastrados",
        rows: recentUsers.map((u) => ({
          nome: u.name,
          email: u.email,
          role: u.role,
          status: u.accountStatus,
          cadastro: u.createdAt.toISOString(),
        })),
      },
      {
        id: "recent_orders",
        label: "Últimos pedidos",
        rows: recentOrders.map((o) => ({
          id: o.id.slice(0, 8),
          cliente: o.user.name,
          valor: o.total,
          status: o.status,
          data: o.createdAt.toISOString(),
        })),
      },
      {
        id: "pending_partners",
        label: "Parceiros aguardando aprovação",
        rows: pendingPartners.map((p) => ({
          nome: p.partnerProfile?.businessName ?? p.name,
          email: p.email,
          cidade: p.partnerProfile?.city ?? "—",
          cadastro: p.createdAt.toISOString(),
        })),
      },
      {
        id: "recent_reports",
        label: "Últimas denúncias",
        rows: recentReports.map((r) => ({
          id: r.id.slice(0, 8),
          motivo: r.reason,
          status: r.status,
          denunciante: r.reporter.name,
          data: r.createdAt.toISOString(),
        })),
      },
      {
        id: "recent_audit",
        label: "Últimos eventos de auditoria",
        rows: recentAudit.map((a) => ({
          data: a.createdAt.toISOString(),
          usuario: a.actor?.name ?? "—",
          acao: a.action,
          modulo: a.module,
          recurso: a.resource,
          observacao: a.observation ?? "—",
        })),
      },
    ],
    checkedAt: now.toISOString(),
  };
}

/** Métricas legadas — mantidas para compatibilidade com /api/admin/overview */
export async function getAdminDashboardMetrics() {
  const data = await getAdminExecutiveDashboard({ page: 1, limit: 20 });
  return data.metrics;
}

export async function getAdminFinanceModule(filters: GestorFilters) {
  const dateWhere = dateRangeWhere(filters);
  const monthStart = startOfMonth();

  const [volume, payments, refunds, orders, paymentList, financialTx] = await Promise.all([
    prisma.order.aggregate({ where: dateWhere, _sum: { total: true }, _avg: { total: true }, _count: { _all: true } }),
    prisma.payment.groupBy({ by: ["status"], _count: { _all: true }, _sum: { amount: true }, where: dateWhere }),
    prisma.payment.count({ where: { ...dateWhere, status: { in: ["REFUNDED", "CANCELLED"] } } }),
    prisma.order.findMany({
      where: dateWhere,
      select: {
        id: true,
        total: true,
        status: true,
        createdAt: true,
        user: { select: { name: true, email: true } },
        partner: { select: { name: true, partnerProfile: { select: { businessName: true } } } },
        payments: { select: { provider: true, status: true, amount: true }, take: 1, orderBy: { createdAt: "desc" } },
      },
      orderBy: { createdAt: "desc" },
      ...paginationArgs(filters),
    }),
    prisma.order.count({ where: dateWhere }),
    prisma.financialTransaction.aggregate({ where: dateWhere, _sum: { amount: true } }),
  ]);

  const succeeded = payments.find((p) => p.status === "SUCCEEDED" || p.status === "PAID");
  const pending = payments.find((p) => p.status === "PENDING");
  const gross = volume._sum.total ?? 0;
  const commissionRate = 0.1;
  const commission = Math.round(gross * commissionRate * 100) / 100;

  return {
    tabs: [
      { id: "overview", label: "Visão geral" },
      { id: "orders", label: "Pedidos e pagamentos" },
      { id: "payouts", label: "Repasses" },
      { id: "commissions", label: "Comissões" },
      { id: "refunds", label: "Reembolsos" },
      { id: "cashflow", label: "Fluxo de caixa" },
    ],
    metrics: [
      { key: "gross", label: "Receita bruta", value: Math.round(gross * 100) / 100 },
      { key: "net", label: "Receita líquida est.", value: Math.round((gross - commission) * 100) / 100 },
      { key: "pending", label: "Receita pendente", value: Math.round((pending?._sum.amount ?? 0) * 100) / 100 },
      { key: "refunds", label: "Reembolsos", value: refunds },
      { key: "commission", label: "Comissão plataforma", value: commission },
      { key: "avg_ticket", label: "Ticket médio", value: Math.round((volume._avg.total ?? 0) * 100) / 100 },
      { key: "mrr", label: "MRR (pedidos mês)", value: Math.round(gross * 100) / 100 },
      { key: "partner_balance", label: "Saldo a repassar est.", value: Math.round((gross - commission) * 100) / 100 },
      { key: "cashflow", label: "Transações financeiras", value: Math.round((financialTx._sum.amount ?? 0) * 100) / 100 },
    ],
    items: orders.map((o) => {
      const pay = o.payments[0];
      const partnerName = o.partner?.partnerProfile?.businessName ?? o.partner?.name ?? "—";
      const comm = Math.round(o.total * commissionRate * 100) / 100;
      return {
        id: o.id.slice(0, 10),
        cliente: o.user.name,
        parceiro: partnerName,
        valorBruto: o.total,
        comissaoEcoPet: comm,
        liquidoParceiro: Math.round((o.total - comm) * 100) / 100,
        statusPagamento: pay?.status ?? o.status,
        gateway: pay?.provider ?? "—",
        data: o.createdAt.toISOString(),
      };
    }),
    cashflow: {
      entradasPrevistas: Math.round(gross * 100) / 100,
      entradasRealizadas: Math.round((succeeded?._sum.amount ?? 0) * 100) / 100,
      saidasPrevistas: commission,
      saidasRealizadas: Math.round((financialTx._sum.amount ?? 0) * 100) / 100,
      saldoPrevisto: Math.round((gross - commission) * 100) / 100,
      saldoReal: Math.round(((succeeded?._sum.amount ?? 0) - (financialTx._sum.amount ?? 0)) * 100) / 100,
    },
    pagination: {
      page: filters.page,
      limit: filters.limit,
      total: paymentList,
      pages: Math.ceil(paymentList / filters.limit) || 1,
    },
    disclaimer: "Comissão estimada em 10% até configuração em PlatformSettings. Dados de pagamento dependem de webhooks do gateway.",
  };
}

export async function getAdminAccountingModule(filters: GestorFilters) {
  const dateWhere = dateRangeWhere(filters);
  const monthStart = startOfMonth();

  const [monthRevenue, transactions, txCount] = await Promise.all([
    prisma.order.aggregate({ where: { createdAt: { gte: monthStart } }, _sum: { total: true } }),
    prisma.financialTransaction.findMany({
      where: dateWhere,
      orderBy: { createdAt: "desc" },
      ...paginationArgs(filters),
      select: { id: true, type: true, category: true, amount: true, description: true, createdAt: true },
    }),
    prisma.financialTransaction.count({ where: dateWhere }),
  ]);

  const revenue = monthRevenue._sum.total ?? 0;
  const expenses = transactions.filter((t) => t.type === "EXPENSE").reduce((s, t) => s + t.amount, 0);

  return {
    tabs: [
      { id: "revenue", label: "Receita fiscal" },
      { id: "invoices", label: "Notas fiscais" },
      { id: "expenses", label: "Despesas" },
      { id: "taxes", label: "Impostos" },
      { id: "reports", label: "Relatórios" },
    ],
    metrics: [
      { key: "monthly_revenue", label: "Faturamento mensal", value: Math.round(revenue * 100) / 100 },
      { key: "tax_base", label: "Base tributável est.", value: Math.round(revenue * 0.85 * 100) / 100 },
      { key: "invoices_issued", label: "Notas emitidas", value: 0 },
      { key: "invoices_pending", label: "Notas pendentes", value: 0 },
      { key: "expenses", label: "Despesas cadastradas", value: Math.round(expenses * 100) / 100 },
      { key: "profit", label: "Lucro contábil est.", value: Math.round((revenue - expenses) * 100) / 100 },
      { key: "taxes", label: "Impostos est. (15%)", value: Math.round(revenue * 0.15 * 100) / 100 },
      { key: "obligations", label: "Obrigações pendentes", value: 0 },
    ],
    items: transactions.map((t) => ({
      categoria: t.category,
      descricao: t.description ?? t.type,
      valor: t.amount,
      data: t.createdAt.toISOString(),
      comprovante: "—",
      status: t.type,
    })),
    pagination: { page: filters.page, limit: filters.limit, total: txCount, pages: Math.ceil(txCount / filters.limit) || 1 },
    disclaimer: "Módulo fiscal: notas fiscais serão integradas quando o provedor NF-e estiver configurado.",
  };
}

export async function getAdminLegalModule(filters: GestorFilters) {
  const [privacyOpen, privacyTotal, reportsCritical, partnersNoContract, privacyItems] = await Promise.all([
    prisma.dataPrivacyRequest.count({ where: { status: "OPEN" } }),
    prisma.dataPrivacyRequest.count(),
    prisma.socialReport.count({ where: { status: "OPEN", reason: { in: ["HARASSMENT", "VIOLENCE", "ANIMAL_ABUSE"] } } }),
    prisma.user.count({
      where: { role: UserRole.PARTNER, accountStatus: AccountStatus.ACTIVE, partnerProfile: { approvedAt: null } },
    }),
    prisma.dataPrivacyRequest.findMany({
      orderBy: { createdAt: "desc" },
      ...paginationArgs(filters),
      select: {
        id: true,
        type: true,
        status: true,
        createdAt: true,
        user: { select: { name: true, email: true } },
      },
    }),
  ]);

  const total = await prisma.dataPrivacyRequest.count();

  return {
    tabs: [
      { id: "contracts", label: "Contratos" },
      { id: "terms", label: "Termos de uso" },
      { id: "lgpd", label: "LGPD" },
      { id: "complaints", label: "Reclamações" },
      { id: "demands", label: "Demandas" },
    ],
    metrics: [
      { key: "contracts", label: "Contratos ativos", value: 0 },
      { key: "terms_accepted", label: "Termos aceitos", value: await prisma.user.count({ where: { termsAcceptedAt: { not: null } } }) },
      { key: "demands_open", label: "Demandas abertas", value: 0 },
      { key: "privacy_open", label: "Solicitações LGPD abertas", value: privacyOpen },
      { key: "critical_reports", label: "Reclamações críticas", value: reportsCritical },
      { key: "lgpd_risks", label: "Riscos LGPD", value: privacyOpen },
      { key: "incomplete_contracts", label: "Parceiros s/ contrato", value: partnersNoContract },
      { key: "docs_pending", label: "Documentos pendentes", value: partnersNoContract },
    ],
    items: privacyItems.map((p) => ({
      id: p.id.slice(0, 8),
      tipo: p.type,
      usuario: p.user.name,
      email: p.user.email,
      status: p.status,
      data: p.createdAt.toISOString(),
    })),
    pagination: { page: filters.page, limit: filters.limit, total, pages: Math.ceil(total / filters.limit) || 1 },
  };
}

export async function getAdminHrModule(filters: GestorFilters) {
  const [admins, gestors, departments, gestorTotal, gestorList, deptList] = await Promise.all([
    prisma.adminProfile.count(),
    prisma.gestorProfile.count(),
    prisma.department.count(),
    prisma.gestorProfile.count(),
    prisma.gestorProfile.findMany({
      ...paginationArgs(filters),
      select: {
        id: true,
        jobTitle: true,
        employeeCode: true,
        user: { select: { id: true, name: true, email: true, accountStatus: true } },
        department: { select: { name: true } },
      },
      orderBy: { user: { name: "asc" } },
    }),
    prisma.department.findMany({ select: { id: true, name: true, code: true } }),
  ]);

  const loginLogs = gestorList.length
    ? await prisma.loginLog.groupBy({
        by: ["userId"],
        _max: { createdAt: true },
        where: { userId: { in: gestorList.map((g) => g.user.id) }, success: true },
      })
    : [];
  const loginMap = new Map(loginLogs.map((l) => [l.userId, l._max.createdAt]));

  const total = gestorTotal;

  return {
    tabs: [
      { id: "collaborators", label: "Colaboradores" },
      { id: "roles", label: "Cargos" },
      { id: "departments", label: "Departamentos" },
      { id: "training", label: "Treinamentos" },
      { id: "requests", label: "Solicitações" },
    ],
    metrics: [
      { key: "collaborators", label: "Colaboradores", value: gestors + admins },
      { key: "active", label: "Ativos", value: gestorList.filter((g) => g.user.accountStatus === "ACTIVE").length },
      { key: "inactive", label: "Inativos", value: gestorList.filter((g) => g.user.accountStatus !== "ACTIVE").length },
      { key: "departments", label: "Departamentos", value: departments },
      { key: "admins", label: "Acessos internos (admin)", value: admins },
      { key: "pending", label: "Pendências", value: 0 },
    ],
    items: gestorList.map((g) => ({
      nome: g.user.name,
      email: g.user.email,
      cargo: g.jobTitle,
      departamento: g.department?.name ?? "—",
      status: g.user.accountStatus,
      acesso: "GESTOR",
      ultimoLogin: loginMap.get(g.user.id)?.toISOString() ?? "—",
    })),
    departments: deptList,
    pagination: { page: filters.page, limit: filters.limit, total, pages: Math.ceil(total / filters.limit) || 1 },
    disclaimer: gestors === 0 ? "Nenhum colaborador GestorProfile cadastrado. Cadastre via banco ou script interno." : undefined,
  };
}

export async function getAdminItModule(filters: GestorFilters) {
  let databaseConnected = false;
  try {
    await prisma.$queryRaw`SELECT 1`;
    databaseConnected = true;
  } catch {
    databaseConnected = false;
  }

  const [failedLogins, blockedUsers, criticalLogs, integrationHealth, recentErrors, sessions] = await Promise.all([
    prisma.loginLog.count({ where: { success: false, createdAt: { gte: new Date(Date.now() - 86400000) } } }),
    prisma.user.count({ where: { accountStatus: AccountStatus.SUSPENDED } }),
    prisma.platformIntegrationLog.count({ where: { status: { in: ["ERROR", "FAILED"] } } }),
    getIntegrationHealthReport(),
    prisma.platformIntegrationLog.findMany({
      where: { status: { in: ["ERROR", "FAILED"] } },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: {
        id: true,
        integrationName: true,
        action: true,
        status: true,
        message: true,
        createdAt: true,
      },
    }),
    prisma.userSession.count({ where: { expiresAt: { gt: new Date() } } }),
  ]);

  const integrationErrors = integrationHealth.integrations.filter((i) => i.status === "ERROR").length;

  return {
    tabs: [
      { id: "health", label: "Saúde do sistema" },
      { id: "logs", label: "Logs técnicos" },
      { id: "security", label: "Segurança" },
      { id: "sessions", label: "Sessões" },
      { id: "database", label: "Banco de dados" },
    ],
    metrics: [
      { key: "system_status", label: "Status do sistema", value: databaseConnected ? "Operacional" : "Degradado" },
      { key: "errors", label: "Erros recentes", value: criticalLogs },
      { key: "critical_logs", label: "Logs críticos", value: criticalLogs },
      { key: "failed_logins", label: "Falhas de login (24h)", value: failedLogins },
      { key: "blocked_users", label: "Usuários bloqueados", value: blockedUsers },
      { key: "integration_errors", label: "Integrações com erro", value: integrationErrors },
      { key: "active_sessions", label: "Sessões ativas", value: sessions },
      { key: "version", label: "Versão", value: process.env.npm_package_version ?? "1.0.0" },
    ],
    items: recentErrors.map((e) => ({
      data: e.createdAt.toISOString(),
      tipo: e.action,
      severidade: e.status,
      integracao: e.integrationName,
      mensagem: e.message ?? "—",
    })),
    databaseConnected,
    integrations: integrationHealth.integrations.map((i) => ({
      name: i.name,
      status: i.status,
      message: i.message,
    })),
  };
}

export async function getAdminInnovationModule(filters: GestorFilters) {
  const monthStart = startOfMonth();
  const [aiSessions, aiUsers, aiErrors, flags, robots, sessions] = await Promise.all([
    prisma.aiSession.count({ where: { createdAt: { gte: monthStart } } }),
    prisma.aiSession.groupBy({ by: ["userId"], where: { createdAt: { gte: monthStart } } }),
    prisma.platformIntegrationLog.count({
      where: { integrationName: { contains: "openai", mode: "insensitive" }, status: { in: ["ERROR", "FAILED"] } },
    }),
    prisma.featureFlag.findMany({ orderBy: { updatedAt: "desc" }, take: 20 }),
    prisma.operationalRobot.count({ where: { isActive: true } }),
    prisma.aiSession.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      select: { id: true, type: true, createdAt: true, user: { select: { name: true } } },
    }),
  ]);

  return {
    tabs: [
      { id: "agents", label: "Agentes de IA" },
      { id: "prompts", label: "Prompts" },
      { id: "costs", label: "Custos" },
      { id: "experiments", label: "Experimentos" },
      { id: "security", label: "Segurança da IA" },
    ],
    metrics: [
      { key: "ai_calls", label: "Chamadas IA no mês", value: aiSessions },
      { key: "ai_cost", label: "Custo estimado IA", value: Math.round(aiSessions * 0.02 * 100) / 100 },
      { key: "ai_users", label: "Usuários usando IA", value: aiUsers.length },
      { key: "ai_errors", label: "Erros de IA", value: aiErrors },
      { key: "models", label: "Modelos ativos", value: 3 },
      { key: "flags", label: "Features experimentais", value: flags.filter((f) => f.enabled).length },
      { key: "robots", label: "Agentes ativos", value: robots },
    ],
    agents: [
      { nome: "Assistente do tutor", status: "ativo" },
      { nome: "Assistente do parceiro", status: "ativo" },
      { nome: "Assistente de ONG", status: "ativo" },
      { nome: "Análise de pet", status: flags.some((f) => f.key.includes("ai")) ? "ativo" : "beta" },
      { nome: "Suporte automático", status: "ativo" },
    ],
    items: flags.map((f) => ({
      nome: f.name,
      finalidade: f.description ?? f.key,
      modelo: f.moduleKey ?? "—",
      status: f.enabled ? "ATIVO" : "INATIVO",
      alteracao: f.updatedAt.toISOString(),
    })),
    recentSessions: sessions.map((s) => ({
      usuario: s.user.name,
      proposito: s.type,
      data: s.createdAt.toISOString(),
    })),
    disclaimer: "Custos de IA são estimados. Configure billing do provedor para valores exatos.",
  };
}

export async function getAdminMarketingModule(filters: GestorFilters) {
  const dateWhere = dateRangeWhere(filters);
  const [campaigns, emailsSent, notifications, campaignList] = await Promise.all([
    prisma.campaign.count({ where: { status: "ACTIVE" } }),
    prisma.emailLog.count({ where: dateWhere }),
    prisma.notification.count({ where: dateWhere }),
    prisma.campaign.findMany({
      where: dateWhere,
      orderBy: { createdAt: "desc" },
      ...paginationArgs(filters),
      select: { id: true, title: true, status: true, category: true, createdAt: true, description: true },
    }),
  ]);

  const total = await prisma.campaign.count({ where: dateWhere });

  return {
    tabs: [
      { id: "campaigns", label: "Campanhas" },
      { id: "emails", label: "E-mails" },
      { id: "push", label: "Push notifications" },
      { id: "metrics", label: "Métricas" },
    ],
    metrics: [
      { key: "campaigns_active", label: "Campanhas ativas", value: campaigns },
      { key: "leads", label: "Leads (usuários novos)", value: await prisma.user.count({ where: dateWhere }) },
      { key: "emails", label: "E-mails enviados", value: emailsSent },
      { key: "notifications", label: "Notificações enviadas", value: notifications },
      { key: "posts", label: "Posts publicados", value: await prisma.socialPost.count({ where: { ...dateWhere, deletedAt: null } }) },
      { key: "open_rate", label: "Taxa abertura", value: 0 },
      { key: "click_rate", label: "Taxa clique", value: 0 },
    ],
    items: campaignList.map((c) => ({
      nome: c.title,
      canal: c.category,
      publico: c.description.slice(0, 60),
      status: c.status,
      data: c.createdAt.toISOString(),
    })),
    pagination: { page: filters.page, limit: filters.limit, total, pages: Math.ceil(total / filters.limit) || 1 },
  };
}

export async function getAdminAdministrativeModule(filters: GestorFilters) {
  const [openTickets, overdueApprovals, approvalItems] = await Promise.all([
    prisma.supportTicket.count({ where: { status: { in: ["OPEN", "IN_PROGRESS"] } } }),
    prisma.approvalRequest.count({ where: { status: "PENDING" } }),
    prisma.approvalRequest.findMany({
      where: { status: "PENDING" },
      orderBy: { createdAt: "desc" },
      ...paginationArgs(filters),
      select: { id: true, type: true, status: true, createdAt: true, requester: { select: { name: true } } },
    }),
  ]);

  const total = await prisma.approvalRequest.count({ where: { status: "PENDING" } });

  return {
    tabs: [
      { id: "tasks", label: "Tarefas" },
      { id: "processes", label: "Processos" },
      { id: "documents", label: "Documentos" },
      { id: "announcements", label: "Comunicados" },
    ],
    metrics: [
      { key: "tasks_open", label: "Tarefas abertas", value: openTickets + overdueApprovals },
      { key: "tasks_overdue", label: "Tarefas atrasadas", value: 0 },
      { key: "approvals", label: "Solicitações pendentes", value: overdueApprovals },
      { key: "tickets", label: "Tickets abertos", value: openTickets },
    ],
    items: approvalItems.map((a) => ({
      titulo: a.type,
      departamento: "—",
      responsavel: a.requester.name,
      prioridade: "NORMAL",
      status: a.status,
      prazo: a.createdAt.toISOString(),
    })),
    pagination: { page: filters.page, limit: filters.limit, total, pages: Math.ceil(total / filters.limit) || 1 },
  };
}

export async function getAdminPermissionsModule(_filters: GestorFilters) {
  const [admins, suspended, rbacRoles, assignments, adminList] = await Promise.all([
    prisma.user.count({ where: { role: UserRole.ADMIN, accountStatus: AccountStatus.ACTIVE } }),
    prisma.user.count({ where: { accountStatus: AccountStatus.SUSPENDED } }),
    prisma.rbacRole.count(),
    prisma.userRbacAssignment.count(),
    prisma.adminProfile.findMany({
      include: { user: { select: { id: true, name: true, email: true, accountStatus: true } } },
    }),
  ]);

  const profiles = ["SUPER_ADMIN", "ADMIN_FULL", "FINANCEIRO", "JURIDICO", "SUPORTE", "MARKETING", "COMERCIAL", "TECNICO", "LEITURA"];

  return {
    tabs: [
      { id: "admins", label: "Administradores" },
      { id: "profiles", label: "Perfis de acesso" },
      { id: "modules", label: "Permissões por módulo" },
      { id: "sessions", label: "Sessões ativas" },
      { id: "history", label: "Histórico" },
    ],
    metrics: [
      { key: "admins_active", label: "Admins ativos", value: admins },
      { key: "collaborators", label: "Colaboradores c/ acesso", value: assignments },
      { key: "profiles", label: "Perfis de permissão", value: rbacRoles || profiles.length },
      { key: "suspended", label: "Usuários suspensos", value: suspended },
      { key: "denied", label: "Tentativas negadas", value: await prisma.loginLog.count({ where: { success: false } }) },
    ],
    profileTypes: profiles.map((p) => ({ perfil: p, descricao: `Perfil ${p}` })),
    items: adminList.map((a) => ({
      nome: a.user.name,
      email: a.user.email,
      cargo: a.jobTitle,
      nivel: a.accessLevel,
      status: a.user.accountStatus,
    })),
    permissions: ["Ver", "Criar", "Editar", "Aprovar", "Suspender", "Excluir", "Exportar", "Configurar"],
  };
}

export async function getAdminLaboratoryModule(_filters: GestorFilters) {
  const flags = await prisma.featureFlag.findMany({ orderBy: { name: "asc" } });
  return {
    tabs: [
      { id: "flags", label: "Feature flags" },
      { id: "integration_tests", label: "Testes de integração" },
      { id: "email_tests", label: "Testes de e-mail" },
      { id: "payment_tests", label: "Testes de pagamento" },
    ],
    metrics: [
      { key: "experiments", label: "Experimentos ativos", value: flags.filter((f) => f.enabled).length },
      { key: "features_test", label: "Features em teste", value: flags.filter((f) => !f.enabled).length },
      { key: "environments", label: "Ambientes", value: 2 },
    ],
    items: flags.map((f) => ({
      nome: f.name,
      descricao: f.description ?? "—",
      status: f.enabled ? "ATIVO" : "INATIVO",
      publico: f.personaScope,
      rollout: `${f.rolloutPct}%`,
    })),
    disclaimer: "Ambiente de laboratório — alterações em feature flags afetam usuários reais. Use com cautela.",
  };
}

export async function getAdminCommercialModule(filters: GestorFilters) {
  const [pendingPartners, quotes, quoteList] = await Promise.all([
    prisma.user.count({ where: { role: UserRole.PARTNER, accountStatus: AccountStatus.PENDING } }),
    prisma.customQuote.count(),
    prisma.customQuote.findMany({
      orderBy: { createdAt: "desc" },
      ...paginationArgs(filters),
      select: {
        id: true,
        status: true,
        createdAt: true,
        requester: { select: { name: true, email: true } },
        provider: { select: { name: true } },
      },
    }),
  ]);

  const total = quotes;
  const approvedPartners = await prisma.user.count({
    where: { role: UserRole.PARTNER, accountStatus: AccountStatus.ACTIVE },
  });

  return {
    tabs: [
      { id: "funnel", label: "Funil comercial" },
      { id: "leads", label: "Leads" },
      { id: "proposals", label: "Propostas" },
      { id: "metrics", label: "Métricas" },
    ],
    metrics: [
      { key: "leads", label: "Leads (pendentes)", value: pendingPartners },
      { key: "negotiation", label: "Em negociação", value: pendingPartners },
      { key: "approved", label: "Parceiros aprovados", value: approvedPartners },
      { key: "conversion", label: "Taxa conversão (%)", value: approvedPartners + pendingPartners > 0 ? Math.round((approvedPartners / (approvedPartners + pendingPartners)) * 100) : 0 },
      { key: "quotes", label: "Propostas enviadas", value: quotes },
    ],
    funnel: [
      { etapa: "Novo lead", count: pendingPartners },
      { etapa: "Contato feito", count: 0 },
      { etapa: "Proposta enviada", count: quotes },
      { etapa: "Negociação", count: pendingPartners },
      { etapa: "Fechado", count: approvedPartners },
      { etapa: "Perdido", count: await prisma.user.count({ where: { role: UserRole.PARTNER, accountStatus: AccountStatus.REJECTED } }) },
    ],
    items: quoteList.map((q) => ({
      id: q.id.slice(0, 8),
      cliente: q.requester.name,
      parceiro: q.provider.name,
      status: q.status,
      data: q.createdAt.toISOString(),
    })),
    pagination: { page: filters.page, limit: filters.limit, total, pages: Math.ceil(total / filters.limit) || 1 },
  };
}

export async function getAdminTechnicalModule(filters: GestorFilters) {
  const { getGestorSupport } = await import("@/lib/gestor/gestor-support-service");
  const support = await getGestorSupport(filters);
  const failedOrders = await prisma.order.count({
    where: { status: { in: ["CANCELLED", "REFUNDED"] } },
  });

  return {
    ...support,
    tabs: [
      { id: "support", label: "Suporte" },
      { id: "tickets", label: "Tickets" },
      { id: "complaints", label: "Reclamações" },
      { id: "orders", label: "Operação de pedidos" },
      { id: "sla", label: "SLA" },
    ],
    metrics: [
      ...(support.metrics ?? []),
      { key: "failed_orders", label: "Pedidos com falha", value: failedOrders },
      { key: "open_reports", label: "Reclamações abertas", value: await prisma.socialReport.count({ where: { status: "OPEN" } }) },
    ],
  };
}

export async function getAdminIntegrationsModule() {
  const { getGestorIntegrations } = await import("@/lib/gestor/gestor-support-service");
  const report = await getGestorIntegrations();

  const items = report.integrations.map((i) => ({
    integracao: i.name,
    status: i.status,
    ambiente: report.environment,
    ultimoTeste: i.lastCheckedAt,
    erro: i.status === "ERROR" ? (i.message ?? "Erro") : "—",
    varsConfiguradas: i.configuredEnvVars.length,
  }));

  return {
    metrics: [
      { key: "active", label: "Integrações ativas", value: report.integrations.filter((i) => i.status === "ACTIVE").length },
      { key: "pending", label: "Pendentes config.", value: report.integrations.filter((i) => i.status === "NOT_CONFIGURED").length },
      { key: "errors", label: "Com erro", value: report.integrations.filter((i) => i.status === "ERROR").length },
      { key: "webhooks", label: "Webhooks (logs)", value: report.recentLogs?.length ?? 0 },
      { key: "emails", label: "E-mails registrados", value: report.emailLogsCount },
    ],
    items,
    integrations: report.integrations,
    recentLogs: report.recentLogs,
    checkedAt: report.checkedAt,
  };
}
