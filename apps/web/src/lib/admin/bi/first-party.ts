import "server-only";

import { AccountStatus, AppointmentStatus, AdoptionRequestStatus, UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { PAID, pctChange } from "@/lib/admin/erp/enrich";
import type { ErpAlert, ErpChart, ErpKpi } from "@/lib/admin/erp/types";
import type { BiDateRange } from "./periods";

function money(n: number) {
  return Math.round(n * 100) / 100;
}

async function countUsersInRange(from: Date, to: Date) {
  return prisma.user.count({ where: { createdAt: { gte: from, lte: to } } });
}

/** Métricas first-party agregadas — sem PII. */
export async function collectFirstPartySnapshot(range: BiDateRange) {
  const { from, to, previousFrom, previousTo } = range;

  const [
    usersNew,
    usersNewPrev,
    usersTotal,
    usersActive,
    partnersActive,
    ongsActive,
    petsTotal,
    petsNew,
    ordersTotal,
    ordersPaid,
    ordersPaidPrev,
    revenue,
    revenuePrev,
    orderItemsSold,
    carts,
    favorites,
    reviews,
    appointments,
    appointmentsDone,
    appointmentsCancelled,
    posts,
    likes,
    comments,
    shares,
    saves,
    messages,
    notifications,
    adoptions,
    integrationErrors,
  ] = await Promise.all([
    countUsersInRange(from, to),
    countUsersInRange(previousFrom, previousTo),
    prisma.user.count(),
    prisma.user.count({
      where: { accountStatus: AccountStatus.ACTIVE, updatedAt: { gte: from } },
    }),
    prisma.user.count({
      where: { role: UserRole.PARTNER, accountStatus: AccountStatus.ACTIVE },
    }),
    prisma.user.count({
      where: { role: UserRole.ONG, accountStatus: AccountStatus.ACTIVE },
    }),
    prisma.pet.count({ where: { deletedAt: null } }),
    prisma.pet.count({ where: { createdAt: { gte: from, lte: to }, deletedAt: null } }),
    prisma.order.count({ where: { createdAt: { gte: from, lte: to } } }),
    prisma.order.count({
      where: { createdAt: { gte: from, lte: to }, status: { in: [...PAID] } },
    }),
    prisma.order.count({
      where: {
        createdAt: { gte: previousFrom, lte: previousTo },
        status: { in: [...PAID] },
      },
    }),
    prisma.order.aggregate({
      where: { createdAt: { gte: from, lte: to }, status: { in: [...PAID] } },
      _sum: { total: true },
    }),
    prisma.order.aggregate({
      where: {
        createdAt: { gte: previousFrom, lte: previousTo },
        status: { in: [...PAID] },
      },
      _sum: { total: true },
    }),
    prisma.orderItem.count({
      where: { order: { createdAt: { gte: from, lte: to }, status: { in: [...PAID] } } },
    }),
    prisma.cart.count({ where: { updatedAt: { gte: from, lte: to } } }),
    prisma.favorite.count({ where: { createdAt: { gte: from, lte: to } } }),
    prisma.review.count({ where: { createdAt: { gte: from, lte: to } } }),
    prisma.appointment.count({ where: { createdAt: { gte: from, lte: to } } }),
    prisma.appointment.count({
      where: { createdAt: { gte: from, lte: to }, status: AppointmentStatus.COMPLETED },
    }),
    prisma.appointment.count({
      where: { createdAt: { gte: from, lte: to }, status: AppointmentStatus.CANCELLED },
    }),
    prisma.socialPost.count({ where: { createdAt: { gte: from, lte: to } } }),
    prisma.socialPostLike.count({ where: { createdAt: { gte: from, lte: to } } }),
    prisma.socialComment.count({ where: { createdAt: { gte: from, lte: to } } }),
    prisma.socialPostShare.count({ where: { createdAt: { gte: from, lte: to } } }),
    prisma.socialPostSave.count({ where: { createdAt: { gte: from, lte: to } } }),
    prisma.message.count({ where: { createdAt: { gte: from, lte: to } } }),
    prisma.notification.count({ where: { createdAt: { gte: from, lte: to } } }),
    prisma.adoptionRequest.count({
      where: {
        updatedAt: { gte: from, lte: to },
        status: { in: [AdoptionRequestStatus.COMPLETED, AdoptionRequestStatus.APPROVED] },
      },
    }),
    prisma.platformIntegrationLog.count({
      where: {
        createdAt: { gte: from, lte: to },
        status: { in: ["ERROR", "FAILED"] },
      },
    }),
  ]);

  const rev = money(revenue._sum.total ?? 0);
  const revPrev = money(revenuePrev._sum.total ?? 0);
  const growth = pctChange(rev, revPrev) ?? 0;
  const avgTicket = ordersPaid > 0 ? money(rev / ordersPaid) : 0;
  const conversion = ordersTotal > 0 ? Math.round((ordersPaid / ordersTotal) * 1000) / 10 : 0;
  const abandonedCarts = Math.max(0, carts - ordersPaid);
  const gaConfigured = Boolean(process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim());

  return {
    usersNew,
    usersNewPrev,
    usersTotal,
    usersActive,
    usersRecurring: Math.max(0, usersActive - usersNew),
    partnersActive,
    ongsActive,
    petsTotal,
    petsNew,
    ordersTotal,
    ordersPaid,
    ordersPaidPrev,
    revenue: rev,
    revenuePrev: revPrev,
    revenueGrowth: growth,
    orderItemsSold,
    carts,
    abandonedCarts,
    favorites,
    reviews,
    appointments,
    appointmentsDone,
    appointmentsCancelled,
    posts,
    likes,
    comments,
    shares,
    saves,
    messages,
    notifications,
    adoptions,
    integrationErrors,
    avgTicket,
    conversion,
    gaConfigured,
  };
}

export type FirstPartySnapshot = Awaited<ReturnType<typeof collectFirstPartySnapshot>>;

export function executiveKpis(s: FirstPartySnapshot): ErpKpi[] {
  return [
    { key: "users_active", label: "Usuários ativos", value: s.usersActive },
    {
      key: "users_new",
      label: "Usuários novos",
      value: s.usersNew,
      delta: pctChange(s.usersNew, s.usersNewPrev),
      deltaLabel: "% vs período ant.",
    },
    { key: "users_recurring", label: "Usuários recorrentes", value: s.usersRecurring },
    { key: "revenue", label: "Receita", value: s.revenue, delta: s.revenueGrowth, deltaLabel: "% vs ant." },
    { key: "orders", label: "Pedidos pagos", value: s.ordersPaid },
    { key: "products_sold", label: "Itens vendidos", value: s.orderItemsSold },
    { key: "appointments", label: "Agendamentos", value: s.appointments },
    { key: "pets", label: "Animais cadastrados", value: s.petsTotal },
    { key: "partners", label: "Parceiros ativos", value: s.partnersActive },
    { key: "ongs", label: "ONGs ativas", value: s.ongsActive },
    { key: "posts", label: "Publicações", value: s.posts },
    { key: "comments", label: "Comentários", value: s.comments },
    { key: "likes", label: "Curtidas", value: s.likes },
    { key: "messages", label: "Mensagens", value: s.messages },
    { key: "notifications", label: "Notificações", value: s.notifications },
    { key: "adoptions", label: "Adoções", value: s.adoptions },
    { key: "services_done", label: "Serviços concluídos", value: s.appointmentsDone },
    { key: "cancellations", label: "Cancelamentos", value: s.appointmentsCancelled },
    { key: "conversion", label: "Taxa conversão (%)", value: s.conversion },
    { key: "avg_ticket", label: "Ticket médio", value: s.avgTicket },
  ];
}

export async function revenueSeries(range: BiDateRange): Promise<ErpChart> {
  const orders = await prisma.order.findMany({
    where: { createdAt: { gte: range.from, lte: range.to }, status: { in: [...PAID] } },
    select: { total: true, createdAt: true },
    take: 10000,
  });
  const buckets = new Map<string, number>();
  for (const o of orders) {
    const key = o.createdAt.toISOString().slice(0, 10);
    buckets.set(key, (buckets.get(key) ?? 0) + o.total);
  }
  const points = [...buckets.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([label, value]) => ({ label, value: money(value) }));
  return {
    id: "revenue_line",
    type: "line",
    title: `Receita — ${range.label}`,
    series: [{ name: "Receita", points }],
  };
}

export async function marketplaceReport(range: BiDateRange, snap: FirstPartySnapshot) {
  const topProducts = await prisma.orderItem.groupBy({
    by: ["productId"],
    where: {
      productId: { not: null },
      order: { createdAt: { gte: range.from, lte: range.to }, status: { in: [...PAID] } },
    },
    _sum: { price: true },
    _count: { _all: true },
    orderBy: { _sum: { price: "desc" } },
    take: 10,
  });
  const ids = topProducts.map((p) => p.productId!).filter(Boolean);
  const products = ids.length
    ? await prisma.product.findMany({
        where: { id: { in: ids } },
        select: { id: true, name: true, category: { select: { name: true } } },
      })
    : [];
  const map = new Map(products.map((p) => [p.id, p]));

  const byCategory = new Map<string, number>();
  for (const p of products) {
    const cat = p.category?.name ?? "Sem categoria";
    const row = topProducts.find((t) => t.productId === p.id);
    byCategory.set(cat, (byCategory.get(cat) ?? 0) + (row?._sum.price ?? 0));
  }

  const kpis: ErpKpi[] = [
    { key: "revenue", label: "Receita", value: snap.revenue },
    { key: "conversion", label: "Conversão (%)", value: snap.conversion },
    { key: "avg_ticket", label: "Ticket médio", value: snap.avgTicket },
    { key: "abandoned", label: "Carrinhos (proxy abandono)", value: snap.abandonedCarts },
    { key: "favorites", label: "Favoritos", value: snap.favorites },
    { key: "reviews", label: "Avaliações", value: snap.reviews },
    { key: "sold", label: "Itens vendidos", value: snap.orderItemsSold },
  ];

  const charts: ErpChart[] = [
    {
      id: "top_products",
      type: "bar",
      title: "Produtos mais vendidos (receita)",
      series: [
        {
          name: "Receita",
          points: topProducts.map((p) => ({
            label: map.get(p.productId!)?.name ?? p.productId!.slice(0, 8),
            value: money(p._sum.price ?? 0),
          })),
        },
      ],
    },
    {
      id: "categories",
      type: "pie",
      title: "Receita por categoria",
      series: [
        {
          name: "Categoria",
          points: [...byCategory.entries()].map(([label, value]) => ({
            label,
            value: money(value),
          })),
        },
      ],
    },
  ];

  return {
    kpis,
    charts,
    tables: [
      {
        id: "top_products_table",
        label: "Ranking de produtos",
        rows: topProducts.map((p, i) => ({
          rank: i + 1,
          product: map.get(p.productId!)?.name ?? "—",
          category: map.get(p.productId!)?.category?.name ?? "—",
          units: p._count._all,
          revenue: money(p._sum.price ?? 0),
        })),
      },
    ],
  };
}

export async function socialReport(_range: BiDateRange, snap: FirstPartySnapshot) {
  const engagement =
    snap.posts > 0
      ? Math.round(((snap.likes + snap.comments + snap.shares) / snap.posts) * 10) / 10
      : 0;

  return {
    kpis: [
      { key: "posts", label: "Posts", value: snap.posts },
      { key: "likes", label: "Curtidas", value: snap.likes },
      { key: "comments", label: "Comentários", value: snap.comments },
      { key: "shares", label: "Compartilhamentos", value: snap.shares },
      { key: "saves", label: "Salvos", value: snap.saves },
      { key: "engagement", label: "Engajamento / post", value: engagement },
    ] satisfies ErpKpi[],
    charts: [
      {
        id: "social_mix",
        type: "pie" as const,
        title: "Mix de engajamento",
        series: [
          {
            name: "Engajamento",
            points: [
              { label: "Curtidas", value: snap.likes },
              { label: "Comentários", value: snap.comments },
              { label: "Shares", value: snap.shares },
              { label: "Salvos", value: snap.saves },
            ],
          },
        ],
      } satisfies ErpChart,
    ],
    tables: [] as { id: string; label: string; rows: Record<string, unknown>[] }[],
  };
}

export async function partnersReport(range: BiDateRange) {
  const byPartner = await prisma.order.groupBy({
    by: ["partnerId"],
    where: {
      partnerId: { not: null },
      createdAt: { gte: range.from, lte: range.to },
      status: { in: [...PAID] },
    },
    _sum: { total: true },
    _count: { _all: true },
    orderBy: { _sum: { total: "desc" } },
    take: 15,
  });
  const ids = byPartner.map((p) => p.partnerId!).filter(Boolean);
  const partners = ids.length
    ? await prisma.user.findMany({
        where: { id: { in: ids } },
        select: {
          id: true,
          name: true,
          partnerProfile: { select: { businessName: true } },
          _count: { select: { products: true } },
        },
      })
    : [];
  const map = new Map(partners.map((p) => [p.id, p]));

  const rows = byPartner.map((p, i) => {
    const partner = map.get(p.partnerId!);
    return {
      rank: i + 1,
      partner: partner?.partnerProfile?.businessName ?? partner?.name ?? "—",
      orders: p._count._all,
      revenue: money(p._sum.total ?? 0),
      products: partner?._count.products ?? 0,
    };
  });

  return {
    kpis: [
      { key: "partners_ranked", label: "Parceiros com vendas", value: rows.length },
      { key: "top_revenue", label: "Top receita", value: rows[0]?.revenue ?? 0 },
    ] satisfies ErpKpi[],
    charts: [
      {
        id: "partner_rank",
        type: "bar" as const,
        title: "Ranking de receita por parceiro",
        series: [
          {
            name: "Receita",
            points: rows.map((r) => ({
              label: String(r.partner).slice(0, 24),
              value: r.revenue as number,
            })),
          },
        ],
      } satisfies ErpChart,
    ],
    tables: [{ id: "partners", label: "Parceiros", rows }],
  };
}

export async function ongsReport(_range: BiDateRange, snap: FirstPartySnapshot) {
  const ongUsers = await prisma.user.findMany({
    where: { role: UserRole.ONG, accountStatus: AccountStatus.ACTIVE },
    select: {
      id: true,
      name: true,
      ongProfile: { select: { name: true, ongName: true } },
      _count: { select: { ongPets: true } },
    },
    take: 50,
  });

  return {
    kpis: [
      { key: "ongs", label: "ONGs ativas", value: snap.ongsActive },
      { key: "pets_new", label: "Animais no período", value: snap.petsNew },
      { key: "pets_total", label: "Animais totais", value: snap.petsTotal },
      { key: "adoptions", label: "Adoções", value: snap.adoptions },
    ] satisfies ErpKpi[],
    charts: [
      {
        id: "ongs_animals",
        type: "bar" as const,
        title: "Animais por ONG (top)",
        series: [
          {
            name: "Animais",
            points: ongUsers.slice(0, 10).map((o) => ({
              label: (o.ongProfile?.ongName ?? o.ongProfile?.name ?? o.name).slice(0, 24),
              value: o._count.ongPets,
            })),
          },
        ],
      } satisfies ErpChart,
    ],
    tables: [
      {
        id: "ongs",
        label: "ONGs",
        rows: ongUsers.map((o, i) => ({
          rank: i + 1,
          ong: o.ongProfile?.ongName ?? o.ongProfile?.name ?? o.name,
          animals: o._count.ongPets,
        })),
      },
    ],
  };
}

export async function servicesReport(_range: BiDateRange, snap: FirstPartySnapshot) {
  return {
    kpis: [
      { key: "scheduled", label: "Agendados", value: snap.appointments },
      { key: "done", label: "Concluídos", value: snap.appointmentsDone },
      { key: "cancelled", label: "Cancelados", value: snap.appointmentsCancelled },
      {
        key: "completion",
        label: "Taxa conclusão (%)",
        value:
          snap.appointments > 0
            ? Math.round((snap.appointmentsDone / snap.appointments) * 1000) / 10
            : 0,
      },
    ] satisfies ErpKpi[],
    charts: [
      {
        id: "services_funnel",
        type: "funnel" as const,
        title: "Funil de serviços",
        series: [
          {
            name: "Serviços",
            points: [
              { label: "Agendados", value: snap.appointments },
              { label: "Concluídos", value: snap.appointmentsDone },
              { label: "Cancelados", value: snap.appointmentsCancelled },
            ],
          },
        ],
      } satisfies ErpChart,
    ],
    tables: [] as { id: string; label: string; rows: Record<string, unknown>[] }[],
  };
}

export async function usersReport(range: BiDateRange, snap: FirstPartySnapshot) {
  const byRole = await prisma.user.groupBy({
    by: ["role"],
    where: { createdAt: { gte: range.from, lte: range.to } },
    _count: { _all: true },
  });

  return {
    kpis: [
      {
        key: "new",
        label: "Cadastros",
        value: snap.usersNew,
        delta: pctChange(snap.usersNew, snap.usersNewPrev),
      },
      { key: "active", label: "Ativos (proxy)", value: snap.usersActive },
      { key: "total", label: "Base total", value: snap.usersTotal },
      { key: "recurring", label: "Recorrentes (proxy)", value: snap.usersRecurring },
    ] satisfies ErpKpi[],
    charts: [
      {
        id: "users_role",
        type: "pie" as const,
        title: "Cadastros por papel",
        series: [
          {
            name: "Papel",
            points: byRole.map((r) => ({ label: r.role, value: r._count._all })),
          },
        ],
      } satisfies ErpChart,
    ],
    tables: [] as { id: string; label: string; rows: Record<string, unknown>[] }[],
  };
}

export function buildBiAlerts(snap: FirstPartySnapshot, gaStatus?: string): ErpAlert[] {
  const alerts: ErpAlert[] = [];
  if (snap.revenueGrowth < -25) {
    alerts.push({
      id: "revenue_drop",
      label: "Queda brusca de receita",
      count: 1,
      severity: "critical",
      href: "/admin/bi/financeiro",
    });
  }
  if (snap.ordersPaid === 0 && snap.ordersTotal === 0) {
    alerts.push({
      id: "marketplace_idle",
      label: "Marketplace sem pedidos no período",
      count: 1,
      severity: "warning",
      href: "/admin/bi/marketplace",
    });
  }
  if (snap.conversion === 0 && snap.ordersTotal > 5) {
    alerts.push({
      id: "conversion_zero",
      label: "Conversão zerada com pedidos criados",
      count: 1,
      severity: "critical",
      href: "/admin/bi/conversoes",
    });
  }
  if (snap.integrationErrors > 0) {
    alerts.push({
      id: "integration_errors",
      label: "Erros de integração",
      count: snap.integrationErrors,
      severity: "critical",
      href: "/admin/integracoes",
    });
  }
  if (!snap.gaConfigured || gaStatus === "NOT_CONFIGURED" || gaStatus === "AUTH_ERROR") {
    alerts.push({
      id: "ga_health",
      label: "Analytics incompleto / Data API pendente",
      count: 1,
      severity: "warning",
      href: "/admin/bi/google-analytics",
    });
  }
  if (snap.posts === 0) {
    alerts.push({
      id: "social_idle",
      label: "Rede social sem publicações no período",
      count: 1,
      severity: "info",
      href: "/admin/bi/social",
    });
  }
  return alerts;
}
