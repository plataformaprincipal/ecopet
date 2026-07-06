import { AccountStatus, UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { GestorFilters } from "@/lib/gestor/gestor-filters";
import { PAID, buildAiInsights, auditToTimeline, pctChange } from "@/lib/admin/erp/enrich";
import type { ErpChart, ErpKpi, ErpModuleResponse } from "@/lib/admin/erp/types";

function startOfDay(d = new Date()) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}
function startOfWeek(d = new Date()) {
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.getFullYear(), d.getMonth(), diff);
}
function startOfMonth(d = new Date()) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}
function startOfYear(d = new Date()) {
  return new Date(d.getFullYear(), 0, 1);
}

async function revenueSince(since: Date) {
  const r = await prisma.order.aggregate({
    where: { createdAt: { gte: since }, status: { in: [...PAID] } },
    _sum: { total: true },
    _count: { _all: true },
  });
  return { total: r._sum.total ?? 0, count: r._count._all };
}

async function revenueSeries(days: number) {
  const since = new Date(Date.now() - days * 86400000);
  const orders = await prisma.order.findMany({
    where: { createdAt: { gte: since }, status: { in: [...PAID] } },
    select: { total: true, createdAt: true },
  });
  const buckets = new Map<string, number>();
  for (const o of orders) {
    const key = o.createdAt.toISOString().slice(0, 10);
    buckets.set(key, (buckets.get(key) ?? 0) + o.total);
  }
  return [...buckets.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([label, value]) => ({ label, value: Math.round(value * 100) / 100 }));
}

/** BI Executivo — KPIs e gráficos com dados reais. */
export async function getErpBiModule(_filters: GestorFilters): Promise<ErpModuleResponse> {
  const now = new Date();
  const monthStart = startOfMonth(now);
  const prevMonthStart = startOfMonth(new Date(now.getFullYear(), now.getMonth() - 1, 1));
  const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

  const [daily, weekly, monthly, yearly, allTime, prevMonthRev, ordersMonthCount, usersTotal, usersActive30, paidOrdersMonth] =
    await Promise.all([
      revenueSince(startOfDay(now)),
      revenueSince(startOfWeek(now)),
      revenueSince(monthStart),
      revenueSince(startOfYear(now)),
      prisma.order.aggregate({ where: { status: { in: [...PAID] } }, _sum: { total: true }, _count: { _all: true } }),
      prisma.order.aggregate({
        where: { createdAt: { gte: prevMonthStart, lte: prevMonthEnd }, status: { in: [...PAID] } },
        _sum: { total: true },
      }),
      prisma.order.count({ where: { createdAt: { gte: monthStart } } }),
      prisma.user.count(),
      prisma.user.count({
        where: { accountStatus: AccountStatus.ACTIVE, updatedAt: { gte: new Date(Date.now() - 30 * 86400000) } },
      }),
      prisma.order.count({ where: { createdAt: { gte: monthStart }, status: { in: [...PAID] } } }),
    ]);

  const growth = pctChange(monthly.total, prevMonthRev._sum.total ?? 0) ?? 0;
  const avgTicket = paidOrdersMonth > 0 ? monthly.total / paidOrdersMonth : 0;
  const conversionOrders = await prisma.order.count();
  const paidOrders = await prisma.order.count({ where: { status: { in: [...PAID] } } });
  const conversion = conversionOrders > 0 ? Math.round((paidOrders / conversionOrders) * 1000) / 10 : 0;

  const [ordersForGeo, byPartner, byCategory, recentAudit, openTickets, openReports, integrationErrors, pendingApprovals] =
    await Promise.all([
      prisma.order.findMany({
        where: { status: { in: [...PAID] } },
        select: { total: true, user: { select: { city: true, state: true } } },
        take: 5000,
      }),
      prisma.order.groupBy({
        by: ["partnerId"],
        where: { partnerId: { not: null }, status: { in: [...PAID] } },
        _sum: { total: true },
        orderBy: { _sum: { total: "desc" } },
        take: 10,
      }),
      prisma.orderItem.groupBy({
        by: ["productId"],
        where: { productId: { not: null } },
        _sum: { price: true },
        orderBy: { _sum: { price: "desc" } },
        take: 10,
      }),
      prisma.auditLog.findMany({
        orderBy: { createdAt: "desc" },
        take: 15,
        select: {
          id: true,
          action: true,
          module: true,
          observation: true,
          createdAt: true,
          actor: { select: { name: true } },
        },
      }),
      prisma.supportTicket.count({ where: { status: { in: ["OPEN", "IN_PROGRESS", "WAITING", "WAITING_USER"] } } }),
      prisma.socialReport.count({ where: { status: "OPEN" } }),
      prisma.platformIntegrationLog.count({ where: { status: { in: ["ERROR", "FAILED"] } } }),
      prisma.user.count({
        where: { accountStatus: AccountStatus.PENDING, role: { in: [UserRole.PARTNER, UserRole.ONG] } },
      }),
    ]);

  const cityMap = new Map<string, number>();
  const stateMap = new Map<string, number>();
  for (const o of ordersForGeo) {
    const city = o.user.city ?? "Não informado";
    const state = o.user.state ?? "—";
    cityMap.set(city, (cityMap.get(city) ?? 0) + o.total);
    stateMap.set(state, (stateMap.get(state) ?? 0) + o.total);
  }
  const byCity = [...cityMap.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10);
  const byState = [...stateMap.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10);

  const partnerIds = byPartner.map((p) => p.partnerId!).filter(Boolean);
  const partners = partnerIds.length
    ? await prisma.user.findMany({
        where: { id: { in: partnerIds } },
        select: { id: true, name: true, partnerProfile: { select: { businessName: true } } },
      })
    : [];
  const partnerMap = new Map(partners.map((p) => [p.id, p.partnerProfile?.businessName ?? p.name]));

  const productIds = byCategory.map((c) => c.productId!).filter(Boolean);
  const products = productIds.length
    ? await prisma.product.findMany({ where: { id: { in: productIds } }, select: { id: true, name: true } })
    : [];
  const productMap = new Map(products.map((p) => [p.id, p.name]));

  const churnSuspended = await prisma.user.count({ where: { accountStatus: AccountStatus.SUSPENDED } });
  const churnRate = usersTotal > 0 ? Math.round((churnSuspended / usersTotal) * 1000) / 10 : 0;
  const ltv = avgTicket * 3;
  const cac = usersTotal > 0 ? Math.round((monthly.total * 0.15) / Math.max(1, usersActive30)) : 0;

  const series30 = await revenueSeries(30);

  const kpis: ErpKpi[] = [
    { key: "rev_daily", label: "Receita diária", value: Math.round(daily.total * 100) / 100 },
    { key: "rev_weekly", label: "Receita semanal", value: Math.round(weekly.total * 100) / 100 },
    { key: "rev_monthly", label: "Receita mensal", value: Math.round(monthly.total * 100) / 100, delta: growth, deltaLabel: "% vs mês ant." },
    { key: "rev_yearly", label: "Receita anual", value: Math.round(yearly.total * 100) / 100 },
    { key: "rev_accum", label: "Receita acumulada", value: Math.round((allTime._sum.total ?? 0) * 100) / 100 },
    { key: "rev_forecast", label: "Receita prevista (mês)", value: Math.round(monthly.total * (1 + growth / 100) * 100) / 100 },
    { key: "rev_realized", label: "Receita realizada (mês)", value: Math.round(monthly.total * 100) / 100 },
    { key: "growth", label: "Crescimento (%)", value: growth, variant: growth < 0 ? "warning" : "success" },
    { key: "churn", label: "Churn (%)", value: churnRate },
    { key: "cac", label: "CAC est.", value: cac },
    { key: "ltv", label: "LTV est.", value: Math.round(ltv * 100) / 100 },
    { key: "avg_ticket", label: "Ticket médio", value: Math.round(avgTicket * 100) / 100 },
    { key: "conversion", label: "Conversão (%)", value: conversion },
  ];

  const charts: ErpChart[] = [
    {
      id: "revenue_line",
      type: "line",
      title: "Receita — últimos 30 dias",
      series: [{ name: "Receita", points: series30 }],
    },
    {
      id: "revenue_city",
      type: "bar",
      title: "Receita por cidade (clientes)",
      series: [
        {
          name: "Clientes",
          points: byCity.map(([label, value]) => ({ label, value: Math.round(value * 100) / 100 })),
        },
      ],
    },
    {
      id: "revenue_state",
      type: "bar",
      title: "Usuários por estado",
      series: [{ name: "Estado", points: byState.map(([label, value]) => ({ label, value: Math.round(value * 100) / 100 })) }],
    },
    {
      id: "revenue_partner",
      type: "bar",
      title: "Receita por parceiro",
      series: [
        {
          name: "Parceiro",
          points: byPartner.map((p) => ({
            label: partnerMap.get(p.partnerId!) ?? p.partnerId!.slice(0, 8),
            value: Math.round((p._sum.total ?? 0) * 100) / 100,
          })),
        },
      ],
    },
    {
      id: "revenue_product",
      type: "pie",
      title: "Receita por produto (itens)",
      series: [
        {
          name: "Produto",
          points: byCategory.map((c) => ({
            label: productMap.get(c.productId!) ?? "—",
            value: Math.round((c._sum.price ?? 0) * 100) / 100,
          })),
        },
      ],
    },
    {
      id: "funnel_orders",
      type: "funnel",
      title: "Funil de pedidos",
      series: [
        {
          name: "Pedidos",
          points: [
            { label: "Criados", value: conversionOrders },
            { label: "Pagos", value: paidOrders },
            { label: "Entregues", value: await prisma.order.count({ where: { status: "DELIVERED" } }) },
          ],
        },
      ],
    },
  ];

  const aiInsights = buildAiInsights({
    revenueGrowth: growth,
    openTickets,
    openReports,
    integrationErrors,
    pendingApprovals,
  });

  return {
    moduleId: "bi",
    title: "Business Intelligence",
    kpis,
    metrics: kpis,
    charts,
    tabs: [
      { id: "dashboard", label: "Dashboard" },
      { id: "charts", label: "Gráficos" },
      { id: "segmentation", label: "Segmentação" },
      { id: "forecast", label: "Previsões" },
    ],
    timeline: auditToTimeline(recentAudit),
    aiInsights,
    alerts: [
      ...(openReports > 0 ? [{ id: "reports", label: "Denúncias abertas", count: openReports, severity: "warning" as const, href: "/admin/social" }] : []),
      ...(integrationErrors > 0 ? [{ id: "int", label: "Erros de integração", count: integrationErrors, severity: "critical" as const, href: "/admin/integracoes" }] : []),
    ],
    quickActions: [
      { label: "Financeiro", href: "/admin/financeiro" },
      { label: "Exportar CSV", href: "/admin/bi?export=csv" },
      { label: "Assistente IA", href: "/admin/assistente" },
    ],
    disclaimer: "CAC/LTV e previsões são estimativas derivadas dos dados reais da plataforma.",
  };
}
