import "server-only";

import { prisma } from "@/lib/prisma";
import { PAID } from "@/lib/admin/erp/enrich";
import { getAnalyticsSanitizedStatus } from "@/lib/analytics/config";
import type { ErpChart, ErpKpi, ErpModuleResponse } from "@/lib/admin/erp/types";
import { withBiCache } from "./cache";
import { BI_DOMAIN_META, type BiDomain } from "./domains";
import { fetchGaInboundReport, getGaDataApiConfig } from "./ga-data-client";
import {
  buildBiAlerts,
  collectFirstPartySnapshot,
  executiveKpis,
  marketplaceReport,
  ongsReport,
  partnersReport,
  revenueSeries,
  servicesReport,
  socialReport,
  usersReport,
} from "./first-party";
import { resolveBiDateRange } from "./periods";

export type BiHubQuery = {
  domain?: string | null;
  period?: string | null;
  dateFrom?: string | null;
  dateTo?: string | null;
  city?: string | null;
  state?: string | null;
  device?: string | null;
};

function meta(domain: BiDomain) {
  return BI_DOMAIN_META.find((d) => d.id === domain)!;
}

function toChartFromRows(
  id: string,
  title: string,
  type: ErpChart["type"],
  rows: { dimension: string; value: number }[]
): ErpChart {
  return {
    id,
    type,
    title,
    series: [
      {
        name: title,
        points: rows.map((r) => ({ label: r.dimension.slice(0, 32), value: r.value })),
      },
    ],
  };
}

/** Relatório por domínio do Centro de Inteligência. */
export async function getBiDomainReport(query: BiHubQuery): Promise<ErpModuleResponse> {
  const domain = (query.domain as BiDomain) || "executive";
  const range = resolveBiDateRange(query);
  const cacheKey = `bi:${domain}:${range.preset}:${range.from.toISOString()}:${range.to.toISOString()}:${query.city ?? ""}:${query.state ?? ""}`;

  return withBiCache(cacheKey, 45_000, async () => {
    const snap = await collectFirstPartySnapshot(range);
    const domainMeta = meta(domain);
    const alerts = buildBiAlerts(snap);
    const quickActions = BI_DOMAIN_META.slice(0, 8).map((d) => ({
      label: d.label,
      href: d.href,
    }));

    const baseTabs = [
      { id: "dashboard", label: "Dashboard" },
      { id: "charts", label: "Gráficos" },
      { id: "data", label: "Dados" },
      { id: "alerts", label: "Alertas" },
    ];

    if (domain === "google-analytics") {
      const ga = await fetchGaInboundReport(range);
      const tracking = getAnalyticsSanitizedStatus();
      const apiCfg = getGaDataApiConfig();
      const kpis: ErpKpi[] = [
        {
          key: "ga_status",
          label: "Data API",
          value: ga.status,
          variant: ga.status === "READY" ? "success" : "warning",
        },
        {
          key: "tracking",
          label: "Tracking client",
          value: tracking.status,
          variant: tracking.status === "READY" ? "success" : "warning",
        },
        { key: "realtime", label: "Usuários realtime", value: ga.realtimeActiveUsers ?? "—" },
        { key: "sessions", label: "Sessões", value: ga.metrics.sessions ?? "—" },
        { key: "active_users", label: "Usuários ativos", value: ga.metrics.activeUsers ?? "—" },
        { key: "new_users", label: "Novos usuários", value: ga.metrics.newUsers ?? "—" },
        { key: "engagement", label: "Engajamento (%)", value: ga.metrics.engagementRate ?? "—" },
        { key: "bounce", label: "Bounce rate (%)", value: ga.metrics.bounceRate ?? "—" },
        { key: "avg_session", label: "Duração média (s)", value: ga.metrics.averageSessionDuration ?? "—" },
        { key: "conversions", label: "Conversões GA", value: ga.metrics.conversions ?? "—" },
        { key: "events", label: "Eventos", value: ga.metrics.eventCount ?? "—" },
        {
          key: "measurement",
          label: "Measurement ID",
          value: ga.measurementIdMasked ?? tracking.measurementIdMasked ?? "—",
        },
        { key: "property", label: "Property ID", value: ga.propertyIdMasked ?? apiCfg.propertyIdMasked ?? "—" },
      ];

      const charts: ErpChart[] = [
        toChartFromRows("ga_source", "Origem / Medium", "bar", ga.dimensions.sourceMedium),
        toChartFromRows("ga_device", "Dispositivos", "pie", ga.dimensions.deviceCategory),
        toChartFromRows("ga_country", "País", "bar", ga.dimensions.country),
        toChartFromRows("ga_pages", "Páginas", "bar", ga.dimensions.pagePath),
      ].filter((c) => c.series[0]?.points.length);

      return {
        moduleId: "bi-google-analytics",
        title: domainMeta.label,
        kpis,
        metrics: kpis,
        charts,
        tables: [
          {
            id: "ga_source_table",
            label: "Source / Medium",
            rows: ga.dimensions.sourceMedium.map((r, i) => ({
              rank: i + 1,
              sourceMedium: r.dimension,
              sessions: r.value,
            })),
          },
        ],
        tabs: baseTabs,
        alerts: buildBiAlerts(snap, ga.status),
        quickActions: [
          { label: "Diagnóstico GA4", href: "/admin/integracoes/google-analytics" },
          { label: "Dashboard executivo", href: "/admin/bi" },
        ],
        period: range.label,
        gaInbound: {
          status: ga.status,
          sanitizedMessage: ga.sanitizedMessage,
          lastError: ga.lastError,
        },
        disclaimer:
          ga.status === "READY"
            ? "Dados lidos sob demanda da GA4 Data API — não armazenados no EcoPet."
            : `${ga.sanitizedMessage} KPIs first-party continuam disponíveis nos outros módulos BI.`,
      };
    }

    if (domain === "marketplace") {
      const report = await marketplaceReport(range, snap);
      return {
        moduleId: "bi-marketplace",
        title: domainMeta.label,
        kpis: report.kpis,
        metrics: report.kpis,
        charts: report.charts,
        tables: report.tables,
        tabs: baseTabs,
        alerts,
        quickActions,
        period: range.label,
      };
    }

    if (domain === "social") {
      const report = await socialReport(range, snap);
      return {
        moduleId: "bi-social",
        title: domainMeta.label,
        kpis: report.kpis,
        metrics: report.kpis,
        charts: report.charts,
        tables: report.tables,
        tabs: baseTabs,
        alerts,
        quickActions,
        period: range.label,
      };
    }

    if (domain === "parceiros") {
      const report = await partnersReport(range);
      return {
        moduleId: "bi-parceiros",
        title: domainMeta.label,
        kpis: report.kpis,
        metrics: report.kpis,
        charts: report.charts,
        tables: report.tables,
        tabs: baseTabs,
        alerts,
        quickActions,
        period: range.label,
      };
    }

    if (domain === "ongs") {
      const report = await ongsReport(range, snap);
      return {
        moduleId: "bi-ongs",
        title: domainMeta.label,
        kpis: report.kpis,
        metrics: report.kpis,
        charts: report.charts,
        tables: report.tables,
        tabs: baseTabs,
        alerts,
        quickActions,
        period: range.label,
      };
    }

    if (domain === "servicos") {
      const report = await servicesReport(range, snap);
      return {
        moduleId: "bi-servicos",
        title: domainMeta.label,
        kpis: report.kpis,
        metrics: report.kpis,
        charts: report.charts,
        tables: report.tables,
        tabs: baseTabs,
        alerts,
        quickActions,
        period: range.label,
      };
    }

    if (domain === "usuarios") {
      const report = await usersReport(range, snap);
      return {
        moduleId: "bi-usuarios",
        title: domainMeta.label,
        kpis: report.kpis,
        metrics: report.kpis,
        charts: report.charts,
        tables: report.tables,
        tabs: baseTabs,
        alerts,
        quickActions,
        period: range.label,
      };
    }

    if (domain === "financeiro" || domain === "performance" || domain === "conversoes") {
      const series = await revenueSeries(range);
      const kpis: ErpKpi[] =
        domain === "financeiro"
          ? [
              { key: "revenue", label: "Receita", value: snap.revenue, delta: snap.revenueGrowth },
              { key: "orders", label: "Pedidos pagos", value: snap.ordersPaid },
              { key: "ticket", label: "Ticket médio", value: snap.avgTicket },
              { key: "items", label: "Itens vendidos", value: snap.orderItemsSold },
            ]
          : domain === "conversoes"
            ? [
                { key: "conversion", label: "Conversão (%)", value: snap.conversion },
                { key: "orders_created", label: "Pedidos criados", value: snap.ordersTotal },
                { key: "orders_paid", label: "Pedidos pagos", value: snap.ordersPaid },
                { key: "users_new", label: "Cadastros", value: snap.usersNew },
                { key: "abandoned", label: "Carrinhos (proxy)", value: snap.abandonedCarts },
              ]
            : [
                { key: "active", label: "Usuários ativos", value: snap.usersActive },
                { key: "messages", label: "Mensagens", value: snap.messages },
                { key: "notifications", label: "Notificações", value: snap.notifications },
                { key: "posts", label: "Posts", value: snap.posts },
                { key: "appointments", label: "Agendamentos", value: snap.appointments },
                {
                  key: "ga_client",
                  label: "GA tracking",
                  value: snap.gaConfigured ? "configurado" : "ausente",
                },
              ];

      const charts: ErpChart[] = [
        series,
        {
          id: "funnel",
          type: "funnel",
          title: "Funil operacional",
          series: [
            {
              name: "Funil",
              points: [
                { label: "Usuários novos", value: snap.usersNew },
                { label: "Pedidos", value: snap.ordersTotal },
                { label: "Pagos", value: snap.ordersPaid },
                { label: "Serviços concluídos", value: snap.appointmentsDone },
              ],
            },
          ],
        },
      ];

      return {
        moduleId: `bi-${domain}`,
        title: domainMeta.label,
        kpis,
        metrics: kpis,
        charts,
        tabs: baseTabs,
        alerts,
        quickActions,
        period: range.label,
      };
    }

    if (domain === "alertas") {
      const list = buildBiAlerts(snap, getGaDataApiConfig().configured ? "READY" : "NOT_CONFIGURED");
      return {
        moduleId: "bi-alertas",
        title: domainMeta.label,
        kpis: [
          { key: "total", label: "Alertas ativos", value: list.length },
          {
            key: "critical",
            label: "Críticos",
            value: list.filter((a) => a.severity === "critical").length,
            variant: "critical",
          },
        ],
        alerts: list,
        tables: [
          {
            id: "alerts",
            label: "Alertas",
            rows: list.map((a) => ({
              id: a.id,
              label: a.label,
              count: a.count,
              severity: a.severity,
              href: a.href ?? "",
            })),
          },
        ],
        tabs: baseTabs,
        quickActions,
        period: range.label,
      };
    }

    if (domain === "exportacoes") {
      return {
        moduleId: "bi-exportacoes",
        title: domainMeta.label,
        kpis: executiveKpis(snap).slice(0, 8),
        tables: [
          {
            id: "export_hint",
            label: "Exportação",
            rows: [
              { format: "CSV", endpoint: "/api/admin/bi/export?format=csv&domain=executive" },
              { format: "Excel", endpoint: "/api/admin/bi/export?format=excel&domain=executive" },
              { format: "JSON", endpoint: "/api/admin/bi/export?format=json&domain=executive" },
              { format: "PDF", endpoint: "/api/admin/bi/export?format=pdf&domain=executive" },
            ],
          },
        ],
        tabs: baseTabs,
        alerts,
        quickActions,
        period: range.label,
        disclaimer: "Exports sanitizados — sem e-mails, tokens ou Measurement ID completo.",
      };
    }

    // executive (default)
    const series = await revenueSeries(range);
    const orders = await prisma.order.findMany({
      where: {
        createdAt: { gte: range.from, lte: range.to },
        status: { in: [...PAID] },
      },
      select: { total: true, user: { select: { city: true, state: true } } },
      take: 3000,
    });
    const cityMap = new Map<string, number>();
    const stateMap = new Map<string, number>();
    for (const o of orders) {
      const city = o.user.city ?? "N/I";
      const state = o.user.state ?? "—";
      if (query.city && city.toLowerCase() !== query.city.toLowerCase()) continue;
      if (query.state && state.toLowerCase() !== query.state.toLowerCase()) continue;
      cityMap.set(city, (cityMap.get(city) ?? 0) + o.total);
      stateMap.set(state, (stateMap.get(state) ?? 0) + o.total);
    }
    const geoOrders = {
      cities: [...cityMap.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10),
      states: [...stateMap.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10),
    };

    const kpis = executiveKpis(snap);
    const charts: ErpChart[] = [
      series,
      {
        id: "revenue_city",
        type: "bar",
        title: "Receita por cidade",
        series: [
          {
            name: "Cidade",
            points: geoOrders.cities.map(([label, value]) => ({
              label,
              value: Math.round(value * 100) / 100,
            })),
          },
        ],
      },
      {
        id: "revenue_state",
        type: "bar",
        title: "Receita por estado",
        series: [
          {
            name: "Estado",
            points: geoOrders.states.map(([label, value]) => ({
              label,
              value: Math.round(value * 100) / 100,
            })),
          },
        ],
      },
      {
        id: "platform_funnel",
        type: "funnel",
        title: "Funil da plataforma",
        series: [
          {
            name: "Funil",
            points: [
              { label: "Cadastros", value: snap.usersNew },
              { label: "Pedidos", value: snap.ordersTotal },
              { label: "Pagos", value: snap.ordersPaid },
              { label: "Serviços ok", value: snap.appointmentsDone },
            ],
          },
        ],
      },
    ];

    return {
      moduleId: "bi-executive",
      title: domainMeta.label,
      kpis,
      metrics: kpis,
      charts,
      tabs: [
        { id: "dashboard", label: "Dashboard" },
        { id: "charts", label: "Gráficos" },
        { id: "segmentation", label: "Segmentação" },
        { id: "data", label: "Dados" },
      ],
      alerts,
      quickActions,
      period: range.label,
      domains: BI_DOMAIN_META,
      disclaimer:
        "Sessões/bounce/UTM vindos do Google exigem GA4 Data API. Métricas EcoPet são first-party (PostgreSQL).",
    };
  });
}
