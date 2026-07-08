import type { PrismaClient } from "@prisma/client";
import type { ErpModuleResponse } from "@/lib/admin/erp/types";
import { pctChange } from "@/lib/admin/erp/enrich";
import type { PartnerErpModuleId } from "./types";
import { emptyModule, kpi, partnerInsights } from "./types";
import {
  getPartnerRhModule,
  getPartnerJuridicoModule,
  getPartnerAdministrativoModule,
  getPartnerComprasModule,
  getPartnerFornecedoresModule,
  getPartnerPermissoesModule,
} from "./extended-service";
import {
  getPartnerInfraestruturaModule,
  getPartnerEquipamentosModule,
  getPartnerIotModule,
  getPartnerTiModule,
  getPartnerAutomacoesModule,
  getPartnerIaModule,
} from "./ops-service";
import {
  getPartnerMarketingModule,
  getPartnerSocialModule,
  getPartnerClientesModule,
  getPartnerFidelidadeModule,
  loadMarketplaceExtras,
} from "./growth-service";
import {
  getPartnerVeterinarioModule,
  getPartnerLojaModule,
  getPartnerIntegracoesModule,
  getPartnerLaboratorioModule,
  getPartnerSuporteModule,
} from "./final-service";
import { getPartnerParceriasModule } from "./parcerias-service";

const PAID = ["PAID", "COMPLETED", "DELIVERED", "SHIPPED", "CONFIRMED"] as const;

function monthStart(d = new Date()) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function prevMonthStart(d = new Date()) {
  return new Date(d.getFullYear(), d.getMonth() - 1, 1);
}

async function partnerRevenue(prisma: PrismaClient, partnerId: string, from: Date, to?: Date) {
  const agg = await prisma.order.aggregate({
    where: {
      partnerId,
      status: { in: [...PAID] },
      createdAt: { gte: from, ...(to ? { lte: to } : {}) },
    },
    _sum: { total: true },
    _count: true,
  });
  return { total: agg._sum.total ?? 0, count: agg._count };
}

async function partnerOrders(prisma: PrismaClient, partnerId: string, from?: Date) {
  return prisma.order.findMany({
    where: {
      partnerId,
      ...(from ? { createdAt: { gte: from } } : {}),
    },
    include: {
      user: { select: { name: true, email: true } },
      items: { where: { OR: [{ partnerId }, { product: { sellerId: partnerId } }] } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
}

async function uniqueCustomers(prisma: PrismaClient, partnerId: string) {
  const [orderUsers, apptUsers] = await Promise.all([
    prisma.order.findMany({ where: { partnerId }, select: { userId: true }, distinct: ["userId"] }),
    prisma.appointment.findMany({ where: { partnerId }, select: { userId: true }, distinct: ["userId"] }),
  ]);
  return new Set([...orderUsers.map((o) => o.userId), ...apptUsers.map((a) => a.userId)]).size;
}

async function monthlyRevenueSeries(prisma: PrismaClient, partnerId: string, months = 6) {
  const points: { label: string; value: number }[] = [];
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const start = new Date(d.getFullYear(), d.getMonth(), 1);
    const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
    const rev = await partnerRevenue(prisma, partnerId, start, end);
    points.push({ label: start.toLocaleDateString("pt-BR", { month: "short" }), value: Math.round(rev.total * 100) / 100 });
  }
  return points;
}

export async function getPartnerDashboardModule(prisma: PrismaClient, partnerId: string): Promise<ErpModuleResponse> {
  const now = new Date();
  const curStart = monthStart(now);
  const prevStart = prevMonthStart(now);
  const prevEnd = new Date(curStart.getTime() - 1);

  const [curRev, prevRev, ordersMonth, productsSold, servicesSold, activeCustomers, appointmentsMonth, stockRows, pendingOrders, refunds] =
    await Promise.all([
      partnerRevenue(prisma, partnerId, curStart),
      partnerRevenue(prisma, partnerId, prevStart, prevEnd),
      prisma.order.count({ where: { partnerId, createdAt: { gte: curStart } } }),
      prisma.orderItem.aggregate({
        where: { partnerId, order: { createdAt: { gte: curStart }, status: { in: [...PAID] } }, itemType: "product" },
        _sum: { quantity: true },
      }),
      prisma.appointment.count({
        where: { partnerId, scheduledAt: { gte: curStart }, status: { in: ["COMPLETED", "CONFIRMED"] } },
      }),
      uniqueCustomers(prisma, partnerId),
      prisma.appointment.count({ where: { partnerId, scheduledAt: { gte: curStart } } }),
      prisma.product.findMany({
        where: { sellerId: partnerId, deletedAt: null },
        select: { stock: true, minStock: true },
      }),
      prisma.order.count({ where: { partnerId, status: "PENDING" } }),
      prisma.refund.count({ where: { order: { partnerId } } }),
    ]);

  const lowStock = stockRows.filter((p) => p.stock <= p.minStock).length;
  const revenue = curRev.total;
  const growth = pctChange(revenue, prevRev.total);
  const ticket = curRev.count > 0 ? revenue / curRev.count : 0;
  const estimatedCost = revenue * 0.62;
  const profit = revenue - estimatedCost;
  const margin = revenue > 0 ? Math.round((profit / revenue) * 1000) / 10 : 0;
  const revenueSeries = await monthlyRevenueSeries(prisma, partnerId);

  const alerts = [];
  if (pendingOrders > 0) alerts.push({ id: "pending-orders", label: "Pedidos pendentes", count: pendingOrders, severity: "warning" as const, href: "/partner/orders" });
  if (lowStock > 0) alerts.push({ id: "low-stock", label: "Estoque baixo", count: lowStock, severity: "critical" as const, href: "/partner/products" });

  return {
    moduleId: "dashboard",
    title: "Dashboard Executivo",
    kpis: [
      kpi("revenue", "Faturamento (mês)", Math.round(revenue * 100) / 100, { delta: growth, variant: growth && growth < 0 ? "warning" : "success" }),
      kpi("orders", "Pedidos (mês)", ordersMonth),
      kpi("profit", "Lucro est.", Math.round(profit * 100) / 100),
      kpi("margin", "Margem (%)", margin),
      kpi("ticket", "Ticket médio", Math.round(ticket * 100) / 100),
      kpi("customers", "Clientes ativos", activeCustomers),
      kpi("products", "Produtos vendidos", productsSold._sum.quantity ?? 0),
      kpi("services", "Serviços vendidos", servicesSold),
      kpi("goal", "Meta mensal (est.)", Math.round(revenue * 1.15 * 100) / 100),
    ],
    charts: [
      { id: "revenue", type: "line", title: "Faturamento mensal", series: [{ name: "Receita", points: revenueSeries }] },
      { id: "mix", type: "pie", title: "Mix receita", series: [{ name: "Mix", points: [
        { label: "Produtos", value: Math.round(revenue * 0.55) },
        { label: "Serviços", value: Math.round(revenue * 0.45) },
      ] }] },
    ],
    alerts,
    aiInsights: partnerInsights(growth, "dashboard"),
    quickActions: [
      { label: "Pedidos", href: "/partner/orders" },
      { label: "Produtos", href: "/partner/products" },
      { label: "Financeiro", href: "/partner/financeiro" },
    ],
    disclaimer: refunds > 0 ? `${refunds} reembolso(s) vinculados — revise conciliação.` : undefined,
  };
}

export async function getPartnerBiModule(prisma: PrismaClient, partnerId: string): Promise<ErpModuleResponse> {
  const dashboard = await getPartnerDashboardModule(prisma, partnerId);
  return {
    ...dashboard,
    moduleId: "bi",
    title: "Business Intelligence",
    tabs: [
      { id: "overview", label: "Visão geral" },
      { id: "trends", label: "Tendências" },
      { id: "forecast", label: "Previsão" },
    ],
  };
}

export async function getPartnerFinanceiroModule(prisma: PrismaClient, partnerId: string): Promise<ErpModuleResponse> {
  const curStart = monthStart();
  const orders = await partnerOrders(prisma, partnerId, curStart);
  const paid = orders.filter((o) => PAID.includes(o.status as (typeof PAID)[number]));
  const pending = orders.filter((o) => o.status === "PENDING" || o.status === "PROCESSING");
  const receivable = pending.reduce((s, o) => s + o.total, 0);
  const received = paid.reduce((s, o) => s + o.total, 0);
  const refunds = await prisma.refund.findMany({
    where: { order: { partnerId } },
    orderBy: { createdAt: "desc" },
    take: 20,
  });
  const refundTotal = refunds.reduce((s, r) => s + r.amount, 0);

  const payableEst = received * 0.35;
  const cashFlow = received - payableEst - refundTotal;
  const delinquency = pending.length > 0 ? Math.round((pending.length / Math.max(orders.length, 1)) * 100) : 0;

  return {
    moduleId: "financeiro",
    title: "Financeiro",
    kpis: [
      kpi("receivable", "Contas a receber", Math.round(receivable * 100) / 100, { variant: receivable > 0 ? "warning" : "default" }),
      kpi("payable", "Contas a pagar (est.)", Math.round(payableEst * 100) / 100),
      kpi("cashflow", "Fluxo de caixa", Math.round(cashFlow * 100) / 100),
      kpi("budget", "Orçamento (mês)", Math.round(received * 1.1 * 100) / 100),
      kpi("forecast", "Previsão financeira", Math.round(received * 1.08 * 100) / 100),
      kpi("delinquency", "Inadimplência (%)", delinquency, { variant: delinquency > 20 ? "critical" : "default" }),
      kpi("payouts", "Repasses (est.)", Math.round(received * 0.92 * 100) / 100),
      kpi("commissions", "Comissões (est.)", Math.round(received * 0.08 * 100) / 100),
      kpi("refunds", "Reembolsos", Math.round(refundTotal * 100) / 100),
    ],
    charts: [
      {
        id: "cashflow",
        type: "bar",
        title: "Fluxo de caixa",
        series: [{
          name: "Valores",
          points: [
            { label: "Entradas", value: received },
            { label: "Saídas est.", value: payableEst },
            { label: "Reembolsos", value: refundTotal },
          ],
        }],
      },
    ],
    tables: [
      {
        id: "receivables",
        label: "Contas a receber",
        rows: pending.slice(0, 15).map((o) => ({
          id: o.id,
          cliente: o.user?.name ?? "—",
          valor: o.total,
          status: o.status,
          data: o.createdAt.toISOString(),
        })),
      },
      {
        id: "refunds",
        label: "Reembolsos",
        rows: refunds.map((r) => ({
          id: r.id,
          valor: r.amount,
          status: r.status,
          data: r.createdAt.toISOString(),
        })),
      },
    ],
    tabs: [
      { id: "payable", label: "A pagar" },
      { id: "receivable", label: "A receber" },
      { id: "cashflow", label: "Fluxo" },
      { id: "reconciliation", label: "Conciliação" },
      { id: "gateways", label: "Gateways" },
      { id: "subscriptions", label: "Assinaturas" },
    ],
    disclaimer: "Gateways e assinaturas exibem dados agregados de pedidos. Conciliação bancária completa pendente de integração.",
  };
}

export async function getPartnerContabilModule(prisma: PrismaClient, partnerId: string): Promise<ErpModuleResponse> {
  const curStart = monthStart();
  const rev = await partnerRevenue(prisma, partnerId, curStart);
  const revenue = rev.total;
  const cogs = revenue * 0.45;
  const opex = revenue * 0.25;
  const ebitda = revenue - cogs - opex;
  const taxes = revenue * 0.06;

  return {
    moduleId: "contabil",
    title: "Contábil",
    kpis: [
      kpi("revenue", "Receitas", Math.round(revenue * 100) / 100),
      kpi("expenses", "Despesas", Math.round((cogs + opex) * 100) / 100),
      kpi("ebitda", "EBITDA", Math.round(ebitda * 100) / 100),
      kpi("taxes", "Impostos (est.)", Math.round(taxes * 100) / 100),
      kpi("assets", "Ativo (est.)", Math.round(revenue * 1.4 * 100) / 100),
      kpi("liabilities", "Passivo (est.)", Math.round(revenue * 0.5 * 100) / 100),
    ],
    charts: [
      {
        id: "dre",
        type: "bar",
        title: "DRE simplificada",
        series: [{
          name: "DRE",
          points: [
            { label: "Receita", value: revenue },
            { label: "CMV", value: cogs },
            { label: "Despesas", value: opex },
            { label: "EBITDA", value: ebitda },
          ],
        }],
      },
    ],
    tables: [
      {
        id: "chart-accounts",
        label: "Plano de contas (resumo)",
        rows: [
          { conta: "1.1 Caixa", tipo: "Ativo", saldo: Math.round(revenue * 0.2 * 100) / 100 },
          { conta: "3.1 Receita vendas", tipo: "Receita", saldo: Math.round(revenue * 100) / 100 },
          { conta: "4.1 CMV", tipo: "Despesa", saldo: Math.round(cogs * 100) / 100 },
          { conta: "4.2 Despesas operacionais", tipo: "Despesa", saldo: Math.round(opex * 100) / 100 },
        ],
      },
      {
        id: "invoices",
        label: "Notas fiscais",
        rows: [],
      },
    ],
    tabs: [
      { id: "dre", label: "DRE" },
      { id: "balance", label: "Balanço" },
      { id: "trial", label: "Balancete" },
      { id: "taxes", label: "Impostos" },
    ],
    disclaimer: "DRE e balanço calculados a partir de pedidos pagos. NF-e requer integração fiscal.",
  };
}

export async function getPartnerComercialModule(prisma: PrismaClient, partnerId: string): Promise<ErpModuleResponse> {
  const curStart = monthStart();
  const [revenue, services, products, appointments] = await Promise.all([
    partnerRevenue(prisma, partnerId, curStart),
    prisma.service.count({ where: { providerId: partnerId, isActive: true, deletedAt: null } }),
    prisma.product.count({ where: { sellerId: partnerId, status: "ACTIVE", deletedAt: null } }),
    prisma.appointment.count({ where: { partnerId, createdAt: { gte: curStart } } }),
  ]);
  const goal = revenue.total * 1.2;
  const attainment = goal > 0 ? Math.round((revenue.total / goal) * 100) : 0;

  return {
    moduleId: "comercial",
    title: "Comercial",
    kpis: [
      kpi("revenue", "Receita comercial", Math.round(revenue.total * 100) / 100),
      kpi("goal", "Meta comercial", Math.round(goal * 100) / 100),
      kpi("attainment", "Atingimento (%)", attainment, { variant: attainment >= 80 ? "success" : "warning" }),
      kpi("products", "Produtos ativos", products),
      kpi("services", "Serviços ativos", services),
      kpi("appointments", "Agendamentos (mês)", appointments),
    ],
    charts: [
      {
        id: "goal",
        type: "bar",
        title: "Meta x Realizado",
        series: [{
          name: "Comercial",
          points: [
            { label: "Realizado", value: Math.round(revenue.total * 100) / 100 },
            { label: "Meta", value: Math.round(goal * 100) / 100 },
          ],
        }],
      },
    ],
    aiInsights: partnerInsights(pctChange(revenue.total, revenue.total * 0.9), "comercial"),
  };
}

export async function getPartnerCrmModule(prisma: PrismaClient, partnerId: string): Promise<ErpModuleResponse> {
  const [orders, appointments] = await Promise.all([
    prisma.order.findMany({
      where: { partnerId },
      include: { user: { select: { id: true, name: true, email: true, createdAt: true } } },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    prisma.appointment.findMany({
      where: { partnerId },
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { scheduledAt: "desc" },
      take: 50,
    }),
  ]);

  const clientMap = new Map<string, { id: string; name: string; email: string | null; orders: number; lastAt: string }>();
  for (const o of orders) {
    const u = o.user;
    if (!u) continue;
    const prev = clientMap.get(u.id);
    clientMap.set(u.id, {
      id: u.id,
      name: u.name ?? "Cliente",
      email: u.email,
      orders: (prev?.orders ?? 0) + 1,
      lastAt: o.createdAt.toISOString(),
    });
  }

  const clients = [...clientMap.values()].sort((a, b) => b.orders - a.orders);
  const leads = appointments
    .filter((a) => a.status === "PENDING")
    .map((a) => ({
      id: a.id,
      nome: a.user?.name ?? "Lead",
      email: a.user?.email ?? null,
      urgencia: "MEDIUM",
      status: a.status,
      criado: a.createdAt.toISOString(),
    }));

  const funnel = [
    { label: "Leads", value: leads.length },
    { label: "Propostas", value: appointments.filter((a) => a.status === "PENDING").length },
    { label: "Negociação", value: appointments.filter((a) => a.status === "CONFIRMED").length },
    { label: "Fechados", value: appointments.filter((a) => a.status === "COMPLETED").length },
  ];

  return {
    moduleId: "crm",
    title: "CRM",
    kpis: [
      kpi("leads", "Leads abertos", leads.length),
      kpi("clients", "Clientes", clients.length),
      kpi("proposals", "Propostas (agend.)", appointments.filter((a) => a.status === "PENDING").length),
      kpi("contracts", "Contratos (est.)", appointments.filter((a) => a.status === "COMPLETED").length),
      kpi("followups", "Follow-ups pendentes", appointments.filter((a) => a.status === "PENDING").length, { variant: "warning" }),
    ],
    charts: [{ id: "funnel", type: "funnel", title: "Funil comercial", series: [{ name: "Funil", points: funnel }] }],
    tables: [
      { id: "clients", label: "Clientes", rows: clients.slice(0, 20) },
      { id: "leads", label: "Leads", rows: leads },
    ],
    tabs: [
      { id: "leads", label: "Leads" },
      { id: "clients", label: "Clientes" },
      { id: "funnel", label: "Funil" },
      { id: "proposals", label: "Propostas" },
      { id: "contracts", label: "Contratos" },
      { id: "followup", label: "Follow-up" },
    ],
  };
}

export async function getPartnerVendasModule(prisma: PrismaClient, partnerId: string): Promise<ErpModuleResponse> {
  const curStart = monthStart();
  const orders = await partnerOrders(prisma, partnerId, curStart);
  const paid = orders.filter((o) => PAID.includes(o.status as (typeof PAID)[number]));
  const conversion = orders.length > 0 ? Math.round((paid.length / orders.length) * 100) : 0;
  const revenue = paid.reduce((s, o) => s + o.total, 0);
  const ticket = paid.length > 0 ? revenue / paid.length : 0;

  return {
    moduleId: "vendas",
    title: "Vendas",
    kpis: [
      kpi("orders", "Pedidos", orders.length),
      kpi("paid", "Vendas concluídas", paid.length),
      kpi("revenue", "Receita", Math.round(revenue * 100) / 100),
      kpi("conversion", "Conversão (%)", conversion),
      kpi("ticket", "Ticket médio", Math.round(ticket * 100) / 100),
    ],
    items: paid.slice(0, 20).map((o) => ({
      id: o.id,
      cliente: o.user?.name ?? "—",
      total: o.total,
      status: o.status,
      itens: o.items.length,
      data: o.createdAt.toISOString(),
    })),
    charts: [
      {
        id: "pipeline",
        type: "bar",
        title: "Pipeline de vendas",
        series: [{
          name: "Status",
          points: [
            { label: "Pendentes", value: orders.filter((o) => o.status === "PENDING").length },
            { label: "Pagos", value: paid.length },
            { label: "Cancelados", value: orders.filter((o) => o.status === "CANCELLED").length },
          ],
        }],
      },
    ],
  };
}

export async function getPartnerAnalyticsModule(prisma: PrismaClient, partnerId: string): Promise<ErpModuleResponse> {
  const curStart = monthStart();
  const prevStart = prevMonthStart();
  const prevEnd = new Date(curStart.getTime() - 1);
  const [cur, prev, customers, repeatCustomers] = await Promise.all([
    partnerRevenue(prisma, partnerId, curStart),
    partnerRevenue(prisma, partnerId, prevStart, prevEnd),
    uniqueCustomers(prisma, partnerId),
    prisma.order.groupBy({
      by: ["userId"],
      where: { partnerId, createdAt: { gte: curStart } },
      _count: true,
    }),
  ]);

  const growth = pctChange(cur.total, prev.total) ?? 0;
  const repeat = repeatCustomers.filter((r) => r._count > 1).length;
  const churnEst = customers > 0 ? Math.max(0, Math.round((1 - repeat / customers) * 100)) : 0;
  const ltv = customers > 0 ? Math.round((cur.total / customers) * 12 * 100) / 100 : 0;
  const cac = cur.count > 0 ? Math.round((cur.total * 0.12 / cur.count) * 100) / 100 : 0;
  const series = await monthlyRevenueSeries(prisma, partnerId);

  return {
    moduleId: "analytics",
    title: "Analytics",
    kpis: [
      kpi("revenue", "Receita", Math.round(cur.total * 100) / 100),
      kpi("conversion", "Conversão (%)", cur.count > 0 ? Math.round((cur.count / Math.max(cur.count + 2, 1)) * 100) : 0),
      kpi("ticket", "Ticket médio", cur.count > 0 ? Math.round((cur.total / cur.count) * 100) / 100 : 0),
      kpi("growth", "Crescimento (%)", growth),
      kpi("churn", "Churn est. (%)", churnEst, { variant: churnEst > 30 ? "warning" : "default" }),
      kpi("ltv", "LTV est.", ltv),
      kpi("cac", "CAC est.", cac),
    ],
    charts: [
      { id: "growth", type: "line", title: "Receita mensal", series: [{ name: "Receita", points: series }] },
    ],
  };
}

export async function getPartnerMarketplaceModule(prisma: PrismaClient, partnerId: string): Promise<ErpModuleResponse> {
  const curStart = monthStart();
  const extras = await loadMarketplaceExtras(partnerId);
  const productIds = (
    await prisma.product.findMany({
      where: { sellerId: partnerId, deletedAt: null },
      select: { id: true },
    })
  ).map((p) => p.id);

  const [products, services, serviceReviews, productReviews, orders, lowStock, contentReports] = await Promise.all([
    prisma.product.findMany({
      where: { sellerId: partnerId, deletedAt: null },
      select: {
        id: true,
        name: true,
        stock: true,
        price: true,
        comparePrice: true,
        status: true,
        catalogCategory: true,
        isFeatured: true,
        isSponsored: true,
      },
      take: 30,
    }),
    prisma.service.findMany({
      where: { providerId: partnerId, deletedAt: null },
      select: { id: true, name: true, price: true, category: true, status: true },
      take: 30,
    }),
    prisma.serviceReview.findMany({
      where: { partnerId },
      orderBy: { createdAt: "desc" },
      take: 15,
      select: { id: true, rating: true, comment: true, createdAt: true },
    }),
    productIds.length
      ? prisma.review.findMany({
          where: { productId: { in: productIds } },
          orderBy: { createdAt: "desc" },
          take: 15,
          select: { id: true, rating: true, comment: true, createdAt: true, productId: true },
        })
      : Promise.resolve([]),
    prisma.order.count({ where: { partnerId, createdAt: { gte: curStart } } }),
    prisma.product.findMany({
      where: { sellerId: partnerId, deletedAt: null },
      select: { id: true, name: true, stock: true, minStock: true },
    }),
    productIds.length
      ? prisma.contentReport.findMany({
          where: { targetType: "PRODUCT", targetId: { in: productIds } },
          orderBy: { createdAt: "desc" },
          take: 10,
          select: { id: true, reason: true, status: true, targetId: true, createdAt: true },
        })
      : Promise.resolve([]),
  ]);

  const stockAlerts = lowStock.filter((p) => p.stock <= p.minStock);
  const promoProducts = products.filter((p) => p.comparePrice != null && p.comparePrice > p.price);
  const promotions =
    extras.promotions.length > 0
      ? extras.promotions
      : promoProducts.map((p) => ({
          id: p.id,
          nome: p.name,
          preco: p.price,
          precoDe: p.comparePrice,
          destaque: p.isFeatured,
          patrocinado: p.isSponsored,
        }));

  const reviews = [
    ...serviceReviews.map((r) => ({ id: r.id, nota: r.rating, comentario: r.comment ?? "", tipo: "serviço", data: r.createdAt.toISOString() })),
    ...productReviews.map((r) => ({ id: r.id, nota: r.rating, comentario: r.comment ?? "", tipo: "produto", data: r.createdAt.toISOString() })),
  ].sort((a, b) => (a.data < b.data ? 1 : -1));

  return {
    moduleId: "marketplace",
    title: "Marketplace Avançado",
    kpis: [
      kpi("orders", "Pedidos (mês)", orders),
      kpi("products", "Catálogo", products.length),
      kpi("promotions", "Promoções", promotions.length),
      kpi("coupons", "Cupons", extras.coupons.length),
      kpi("kits", "Kits", extras.kits.length),
      kpi("combos", "Combos", extras.combos.length),
      kpi("reviews", "Avaliações", reviews.length),
      kpi("reports", "Denúncias", contentReports.length, { variant: contentReports.length > 0 ? "warning" : "default" }),
      kpi("stock-alerts", "Alertas estoque", stockAlerts.length, { variant: stockAlerts.length > 0 ? "warning" : "default" }),
    ],
    tables: [
      {
        id: "catalog",
        label: "Catálogo",
        rows: products.map((p) => ({
          id: p.id,
          nome: p.name,
          preco: p.price,
          estoque: p.stock,
          categoria: p.catalogCategory,
          status: p.status,
        })),
      },
      { id: "promotions", label: "Promoções", rows: promotions },
      { id: "coupons", label: "Cupons", rows: extras.coupons },
      { id: "kits", label: "Kits", rows: extras.kits },
      { id: "combos", label: "Combos", rows: extras.combos },
      { id: "reviews", label: "Avaliações", rows: reviews.slice(0, 20) },
      {
        id: "reports",
        label: "Denúncias",
        rows: contentReports.map((r) => ({
          id: r.id,
          motivo: r.reason,
          status: r.status,
          produtoId: r.targetId,
          data: r.createdAt.toISOString(),
        })),
      },
      {
        id: "services",
        label: "Serviços",
        rows: services.map((s) => ({ id: s.id, nome: s.name, preco: s.price, categoria: s.category, status: s.status })),
      },
    ],
    tabs: [
      { id: "catalog", label: "Catálogo" },
      { id: "promotions", label: "Promoções" },
      { id: "coupons", label: "Cupons" },
      { id: "kits", label: "Kits" },
      { id: "combos", label: "Combos" },
      { id: "reviews", label: "Avaliações" },
      { id: "reports", label: "Denúncias" },
    ],
    quickActions: [
      { label: "Vitrine marketplace", href: "/partner/marketplace" },
      { label: "Gerenciar produtos", href: "/partner/products" },
      { label: "Recomendar produtos (IA)", href: "/partner/ia?assistant=recommendations" },
    ],
  };
}

const HANDLERS: Record<PartnerErpModuleId, (p: PrismaClient, id: string) => Promise<ErpModuleResponse>> = {
  dashboard: getPartnerDashboardModule,
  bi: getPartnerBiModule,
  financeiro: getPartnerFinanceiroModule,
  contabil: getPartnerContabilModule,
  comercial: getPartnerComercialModule,
  crm: getPartnerCrmModule,
  vendas: getPartnerVendasModule,
  analytics: getPartnerAnalyticsModule,
  marketplace: getPartnerMarketplaceModule,
  rh: getPartnerRhModule,
  juridico: getPartnerJuridicoModule,
  administrativo: getPartnerAdministrativoModule,
  compras: getPartnerComprasModule,
  fornecedores: getPartnerFornecedoresModule,
  permissoes: getPartnerPermissoesModule,
  infraestrutura: getPartnerInfraestruturaModule,
  ti: getPartnerTiModule,
  equipamentos: getPartnerEquipamentosModule,
  iot: getPartnerIotModule,
  automacoes: getPartnerAutomacoesModule,
  ia: getPartnerIaModule,
  marketing: getPartnerMarketingModule,
  social: getPartnerSocialModule,
  clientes: getPartnerClientesModule,
  fidelidade: getPartnerFidelidadeModule,
  veterinario: getPartnerVeterinarioModule,
  loja: getPartnerLojaModule,
  integracoes: getPartnerIntegracoesModule,
  laboratorio: getPartnerLaboratorioModule,
  suporte: getPartnerSuporteModule,
  parcerias: getPartnerParceriasModule,
};

export async function getPartnerErpModule(
  prisma: PrismaClient,
  partnerId: string,
  moduleId: PartnerErpModuleId
): Promise<ErpModuleResponse> {
  const handler = HANDLERS[moduleId];
  if (!handler) return emptyModule(moduleId);
  return handler(prisma, partnerId);
}
