import type { PrismaClient } from "@prisma/client";

export type PartnerAiInsight = {
  id: string;
  type:
    | "profile"
    | "messages"
    | "services"
    | "products"
    | "descriptions"
    | "reviews"
    | "stock";
  priority: "high" | "medium" | "low";
  title: string;
  description: string;
  actionHref?: string;
  actionLabel?: string;
};

export type PartnerDashboardSummary = {
  recentOrders: Array<{
    id: string;
    status: string;
    total: number;
    createdAt: string;
    userName: string | null;
  }>;
  recentAppointments: Array<{
    id: string;
    status: string;
    scheduledAt: string;
    serviceName: string | null;
    clientName: string | null;
  }>;
  pendingMessages: number;
  recentReviews: Array<{
    id: string;
    rating: number;
    comment: string | null;
    createdAt: string;
    serviceName: string | null;
    userName: string | null;
  }>;
  lowStockProducts: Array<{
    id: string;
    name: string;
    stock: number;
    minStock: number;
  }>;
  insights: PartnerAiInsight[];
  stats: {
    ordersCount: number;
    appointmentsPending: number;
    servicesActive: number;
    productsActive: number;
  };
};

export async function buildPartnerDashboardSummary(
  prisma: PrismaClient,
  partnerId: string
): Promise<PartnerDashboardSummary> {
  const [
    recentOrders,
    recentAppointments,
    pendingMessages,
    recentReviews,
    lowStockProducts,
    profile,
    servicesCount,
    productsCount,
    appointmentsPending,
    inactiveProducts,
    servicesWithShortDescription,
    unansweredReviews,
  ] = await Promise.all([
    prisma.order.findMany({
      where: { partnerId },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        status: true,
        total: true,
        createdAt: true,
        user: { select: { name: true } },
      },
    }),
    prisma.appointment.findMany({
      where: { partnerId },
      orderBy: { scheduledAt: "desc" },
      take: 5,
      select: {
        id: true,
        status: true,
        scheduledAt: true,
        service: { select: { name: true } },
        user: { select: { name: true } },
      },
    }),
    prisma.message.count({
      where: {
        read: false,
        deletedAt: null,
        senderId: { not: partnerId },
        conversation: {
          participants: { some: { userId: partnerId, leftAt: null } },
        },
      },
    }),
    prisma.serviceReview.findMany({
      where: { partnerId, moderationStatus: "VISIBLE" },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        rating: true,
        comment: true,
        createdAt: true,
        service: { select: { name: true } },
        user: { select: { name: true } },
      },
    }),
    prisma.product.findMany({
      where: {
        sellerId: partnerId,
        deletedAt: null,
      },
      orderBy: { stock: "asc" },
      take: 30,
      select: { id: true, name: true, stock: true, minStock: true },
    }),
    prisma.partnerProfile.findUnique({
      where: { userId: partnerId },
      select: {
        businessName: true,
        description: true,
        cnpj: true,
        address: true,
        businessHours: true,
        verificationStatus: true,
      },
    }),
    prisma.service.count({
      where: { providerId: partnerId, deletedAt: null, status: "ACTIVE", isActive: true },
    }),
    prisma.product.count({
      where: {
        sellerId: partnerId,
        deletedAt: null,
        status: "ACTIVE",
        approvalStatus: "APPROVED",
      },
    }),
    prisma.appointment.count({
      where: { partnerId, status: "PENDING" },
    }),
    prisma.product.count({
      where: {
        sellerId: partnerId,
        deletedAt: null,
        status: { in: ["INACTIVE", "DRAFT"] },
        updatedAt: { lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      },
    }),
    prisma.service.findMany({
      where: { providerId: partnerId, deletedAt: null },
      select: { description: true },
    }),
    prisma.serviceReview.count({
      where: { partnerId, rating: { lte: 3 } },
    }),
  ]);

  const servicesWithoutDescription = servicesWithShortDescription.filter(
    (s) => s.description.trim().length < 20
  ).length;

  const lowStockFiltered = lowStockProducts
    .filter((p) => p.stock <= 0 || p.stock <= p.minStock)
    .slice(0, 10);

  const insights: PartnerAiInsight[] = [];

  if (!profile?.description?.trim() || !profile.businessHours?.trim()) {
    insights.push({
      id: "improve-profile",
      type: "profile",
      priority: "high",
      title: "Complete seu perfil comercial",
      description:
        "Parceiros com perfil completo convertem mais. Adicione descrição, horários e dados comerciais.",
      actionHref: "/parceiro/perfil-gestao",
      actionLabel: "Editar perfil",
    });
  }

  if (pendingMessages > 0) {
    insights.push({
      id: "reply-messages",
      type: "messages",
      priority: "high",
      title: `${pendingMessages} mensagem(ns) aguardando resposta`,
      description: "Clientes esperam retorno rápido. Responder aumenta a confiança na sua loja.",
      actionHref: "/dashboard/messages",
      actionLabel: "Ver mensagens",
    });
  }

  if (servicesCount === 0) {
    insights.push({
      id: "add-services",
      type: "services",
      priority: "medium",
      title: "Cadastre seus serviços",
      description: "Você ainda não possui serviços ativos. Publique para receber agendamentos.",
      actionHref: "/dashboard/partner/services/new",
      actionLabel: "Novo serviço",
    });
  }

  if (inactiveProducts > 0) {
    insights.push({
      id: "review-stale-products",
      type: "products",
      priority: "medium",
      title: `${inactiveProducts} produto(s) parado(s) há mais de 30 dias`,
      description: "Revise preços, estoque e descrições para reativar itens inativos.",
      actionHref: "/parceiro/marketplace",
      actionLabel: "Revisar vitrine",
    });
  }

  if (servicesWithoutDescription > 0) {
    insights.push({
      id: "improve-descriptions",
      type: "descriptions",
      priority: "low",
      title: "Melhore descrições de serviços",
      description: `${servicesWithoutDescription} serviço(s) com descrição incompleta.`,
      actionHref: "/parceiro/agenda-servicos",
      actionLabel: "Gerenciar serviços",
    });
  }

  if (unansweredReviews > 0) {
    insights.push({
      id: "follow-reviews",
      type: "reviews",
      priority: "medium",
      title: "Acompanhe avaliações recentes",
      description: `${unansweredReviews} avaliação(ões) com nota baixa sem resposta.`,
      actionHref: "/parceiro/agenda-servicos",
      actionLabel: "Ver avaliações",
    });
  }

  if (lowStockFiltered.length > 0) {
    insights.push({
      id: "stock-alerts",
      type: "stock",
      priority: "high",
      title: "Alertas de estoque",
      description: `${lowStockFiltered.length} produto(s) no limite mínimo de estoque.`,
      actionHref: "/parceiro/marketplace",
      actionLabel: "Atualizar estoque",
    });
  }

  return {
    recentOrders: recentOrders.map((o) => ({
      id: o.id,
      status: o.status,
      total: o.total,
      createdAt: o.createdAt.toISOString(),
      userName: o.user?.name ?? null,
    })),
    recentAppointments: recentAppointments.map((a) => ({
      id: a.id,
      status: a.status,
      scheduledAt: a.scheduledAt.toISOString(),
      serviceName: a.service?.name ?? null,
      clientName: a.user?.name ?? null,
    })),
    pendingMessages,
    recentReviews: recentReviews.map((r) => ({
      id: r.id,
      rating: r.rating,
      comment: r.comment,
      createdAt: r.createdAt.toISOString(),
      serviceName: r.service?.name ?? null,
      userName: r.user?.name ?? null,
    })),
    lowStockProducts: lowStockFiltered,
    insights,
    stats: {
      ordersCount: recentOrders.length,
      appointmentsPending,
      servicesActive: servicesCount,
      productsActive: productsCount,
    },
  };
}
