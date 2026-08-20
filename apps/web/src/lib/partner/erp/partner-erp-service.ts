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
import { metricsFromOrderRow, roundMetric } from "@/lib/finance/metrics";
import { getPartnerBalances } from "@/lib/finance/balances";

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
    _sum: { total: true, grossAmount: true, platformFeeAmount: true, partnerAmount: true, reserveAmount: true, discount: true },
    _count: true,
  });
  const gmv = agg._sum.grossAmount && agg._sum.grossAmount > 0 ? agg._sum.grossAmount : (agg._sum.total ?? 0);
  return {
    gmv,
    platformRevenue: agg._sum.platformFeeAmount ?? 0,
    partnerEconomicValue: agg._sum.partnerAmount ?? 0,
    reserveAmount: agg._sum.reserveAmount ?? 0,
    discountAmount: agg._sum.discount ?? 0,
    total: gmv,
    count: agg._count,
  };
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
    points.push({ label: start.toLocaleDateString("pt-BR", { month: "short" }), value: Math.round(rev.gmv * 100) / 100 });
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
  const gmv = curRev.gmv;
  const growth = pctChange(gmv, prevRev.gmv);
  const ticket = curRev.count > 0 ? gmv / curRev.count : 0;
  const revenueSeries = await monthlyRevenueSeries(prisma, partnerId);

  const alerts = [];
  if (pendingOrders > 0) alerts.push({ id: "pending-orders", label: "Pedidos pendentes", count: pendingOrders, severity: "warning" as const, href: "/partner/orders" });
  if (lowStock > 0) alerts.push({ id: "low-stock", label: "Estoque baixo", count: lowStock, severity: "critical" as const, href: "/partner/products" });

  return {
    moduleId: "dashboard",
    title: "Dashboard Executivo",
    kpis: [
      kpi("gmv", "GMV (mês)", Math.round(curRev.gmv * 100) / 100, { delta: growth, variant: growth && growth < 0 ? "warning" : "success" }),
      kpi("platform", "Comissão EccoPet (snapshot)", Math.round(curRev.platformRevenue * 100) / 100),
      kpi("payout", "Payout estimado (não liquidado)", Math.round(curRev.partnerEconomicValue * 100) / 100),
      kpi("orders", "Pedidos (mês)", ordersMonth),
      kpi("ticket", "Ticket médio (GMV)", Math.round(ticket * 100) / 100),
      kpi("customers", "Clientes ativos", activeCustomers),
      kpi("products", "Produtos vendidos", productsSold._sum.quantity ?? 0),
      kpi("services", "Serviços vendidos", servicesSold),
      kpi("pending", "Pedidos pendentes", pendingOrders, { variant: pendingOrders > 0 ? "warning" : "default" }),
    ],
    charts: [
      { id: "gmv", type: "line", title: "GMV mensal (não é lucro)", series: [{ name: "GMV", points: revenueSeries }] },
    ],
    alerts,
    aiInsights: partnerInsights(growth, "dashboard"),
    quickActions: [
      { label: "Pedidos", href: "/partner/orders" },
      { label: "Produtos", href: "/partner/products" },
      { label: "Financeiro", href: "/partner/financeiro" },
    ],
    disclaimer: "GMV ≠ lucro. Comissão e payout vêm do snapshot do pedido. Split Mercado Pago não habilitado. Estimativa ≠ saldo disponível.",
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
  const [orders, refunds, balances] = await Promise.all([
    partnerOrders(prisma, partnerId, curStart),
    prisma.refund.findMany({
      where: { order: { partnerId } },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    getPartnerBalances(partnerId),
  ]);
  const paid = orders.filter((o) => PAID.includes(o.status as (typeof PAID)[number]));
  const pending = orders.filter((o) => o.status === "PENDING" || o.status === "PROCESSING");
  const paidMetrics = paid.reduce(
    (acc, o) => {
      const m = metricsFromOrderRow(o);
      acc.gmv += m.gmv;
      acc.platformRevenue += m.platformRevenue;
      acc.partnerEconomicValue += m.partnerEconomicValue;
      acc.estimatedPayout += m.estimatedPayout;
      return acc;
    },
    { gmv: 0, platformRevenue: 0, partnerEconomicValue: 0, estimatedPayout: 0 }
  );
  const pendingGmv = pending.reduce((s, o) => s + metricsFromOrderRow(o).gmv, 0);
  const refundTotal = refunds.reduce((s, r) => s + r.amount, 0);

  return {
    moduleId: "financeiro",
    title: "Financeiro",
    kpis: [
      kpi("gmv", "GMV (mês, pedidos pagos)", roundMetric(paidMetrics.gmv)),
      kpi("commission", "Comissão EccoPet (snapshot)", roundMetric(paidMetrics.platformRevenue)),
      kpi("partner", "Valor econômico do parceiro", roundMetric(paidMetrics.partnerEconomicValue)),
      kpi("payout_est", "Payout estimado", roundMetric(paidMetrics.estimatedPayout)),
      kpi("pending_gmv", "GMV em processamento", roundMetric(pendingGmv), { variant: pendingGmv > 0 ? "warning" : "default" }),
      kpi("ledger_pending", "Ledger pendente", roundMetric(balances.asFloats.pending)),
      kpi("ledger_available", "Ledger disponível (≠ payout MP)", roundMetric(balances.asFloats.available)),
      kpi("ledger_paid", "Payout liquidado (ledger)", roundMetric(balances.asFloats.paid)),
      kpi("refunds", "Reembolsos", roundMetric(refundTotal)),
    ],
    charts: [
      {
        id: "split",
        type: "bar",
        title: "Composição do mês (snapshots)",
        series: [{
          name: "Valores",
          points: [
            { label: "GMV", value: paidMetrics.gmv },
            { label: "EccoPet", value: paidMetrics.platformRevenue },
            { label: "Parceiro", value: paidMetrics.partnerEconomicValue },
            { label: "Estornos", value: refundTotal },
          ],
        }],
      },
    ],
    tables: [
      {
        id: "receivables",
        label: "Pedidos em processamento",
        rows: pending.slice(0, 15).map((o) => {
          const m = metricsFromOrderRow(o);
          return {
            id: o.id,
            cliente: o.user?.name ?? "—",
            gmv: roundMetric(m.gmv),
            payoutEstimado: roundMetric(m.estimatedPayout),
            status: o.status,
            data: o.createdAt.toISOString(),
          };
        }),
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
      { id: "overview", label: "Visão geral" },
      { id: "receivable", label: "Em processamento" },
      { id: "payout", label: "Repasse" },
      { id: "refunds", label: "Estornos" },
    ],
    disclaimer:
      "Split Mercado Pago não habilitado (splitReady=false). Payout estimado ≠ saldo disponível ≠ payout liquidado. Ledger não prova repasse no PSP.",
  };
}

export async function getPartnerContabilModule(prisma: PrismaClient, partnerId: string): Promise<ErpModuleResponse> {
  const curStart = monthStart();
  const rev = await partnerRevenue(prisma, partnerId, curStart);

  return {
    moduleId: "contabil",
    title: "Contábil operacional",
    kpis: [
      kpi("gmv", "GMV (mês)", roundMetric(rev.gmv)),
      kpi("platform", "Receita EccoPet (não é do parceiro)", roundMetric(rev.platformRevenue)),
      kpi("partner", "Valor econômico do parceiro", roundMetric(rev.partnerEconomicValue)),
      kpi("reserve", "Reserva snapshot", roundMetric(rev.reserveAmount)),
    ],
    charts: [
      {
        id: "composition",
        type: "bar",
        title: "Composição (não é DRE fiscal)",
        series: [{
          name: "Snapshots",
          points: [
            { label: "GMV", value: rev.gmv },
            { label: "EccoPet", value: rev.platformRevenue },
            { label: "Parceiro", value: rev.partnerEconomicValue },
          ],
        }],
      },
    ],
    tables: [
      {
        id: "notes",
        label: "Notas",
        rows: [
          { item: "Contabilidade legal", status: "não emitida neste módulo" },
          { item: "Split PSP", status: "não habilitado" },
        ],
      },
    ],
    tabs: [
      { id: "overview", label: "Visão operacional" },
    ],
    disclaimer: "Não substitui escrituração fiscal. CMV/EBITDA não são estimados por percentual.",
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

  return {
    moduleId: "comercial",
    title: "Comercial",
    kpis: [
      kpi("gmv", "GMV comercial (mês)", Math.round(revenue.gmv * 100) / 100),
      kpi("platform", "Comissão EccoPet", Math.round(revenue.platformRevenue * 100) / 100),
      kpi("products", "Produtos ativos", products),
      kpi("services", "Serviços ativos", services),
      kpi("appointments", "Agendamentos (mês)", appointments),
    ],
    charts: [
      {
        id: "gmv",
        type: "bar",
        title: "GMV do mês",
        series: [{
          name: "Comercial",
          points: [
            { label: "GMV", value: Math.round(revenue.gmv * 100) / 100 },
          ],
        }],
      },
    ],
    aiInsights: partnerInsights(pctChange(revenue.gmv, revenue.gmv), "comercial"),
    disclaimer: "Sem meta fictícia. GMV não é lucro do parceiro.",
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
  const paidMetrics = paid.reduce(
    (acc, o) => {
      const m = metricsFromOrderRow(o);
      acc.gmv += m.gmv;
      acc.platformRevenue += m.platformRevenue;
      return acc;
    },
    { gmv: 0, platformRevenue: 0 }
  );
  const ticket = paid.length > 0 ? paidMetrics.gmv / paid.length : 0;

  return {
    moduleId: "vendas",
    title: "Vendas",
    kpis: [
      kpi("orders", "Pedidos", orders.length),
      kpi("paid", "Vendas concluídas", paid.length),
      kpi("gmv", "GMV", Math.round(paidMetrics.gmv * 100) / 100),
      kpi("commission", "Comissão EccoPet", Math.round(paidMetrics.platformRevenue * 100) / 100),
      kpi("conversion", "Conversão pedido→pago (%)", conversion),
      kpi("ticket", "Ticket médio (GMV)", Math.round(ticket * 100) / 100),
    ],
    items: paid.slice(0, 20).map((o) => {
      const m = metricsFromOrderRow(o);
      return {
        id: o.id,
        cliente: o.user?.name ?? "—",
        gmv: roundMetric(m.gmv),
        payoutEstimado: roundMetric(m.estimatedPayout),
        status: o.status,
        itens: o.items.length,
        data: o.createdAt.toISOString(),
      };
    }),
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

  const growth = pctChange(cur.gmv, prev.gmv) ?? 0;
  const repeat = repeatCustomers.filter((r) => r._count > 1).length;
  const series = await monthlyRevenueSeries(prisma, partnerId);

  return {
    moduleId: "analytics",
    title: "Analytics",
    kpis: [
      kpi("gmv", "GMV", Math.round(cur.gmv * 100) / 100),
      kpi("platform", "Receita EccoPet", Math.round(cur.platformRevenue * 100) / 100),
      kpi("ticket", "Ticket médio (GMV)", cur.count > 0 ? Math.round((cur.gmv / cur.count) * 100) / 100 : 0),
      kpi("growth", "Variação GMV (%)", growth),
      kpi("customers", "Clientes únicos", customers),
      kpi("repeat", "Clientes com >1 pedido no mês", repeat),
    ],
    charts: [
      { id: "growth", type: "line", title: "GMV mensal", series: [{ name: "GMV", points: series }] },
    ],
    disclaimer: "Sem LTV/CAC/churn estimado. Contadores reais apenas.",
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
