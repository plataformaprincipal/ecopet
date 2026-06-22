import type { PrismaClient } from "@prisma/client";

export type ClientRecommendation = {
  id: string;
  title: string;
  description: string;
  href: string;
};

export type ClientDashboardSummary = {
  pets: Array<{ id: string; name: string; species: string }>;
  petsCount: number;
  upcomingReminders: Array<{
    id: string;
    title: string;
    dueAt: string;
    petName: string;
  }>;
  upcomingAppointments: Array<{
    id: string;
    scheduledAt: string;
    status: string;
    serviceName: string | null;
    partnerName: string | null;
  }>;
  recentOrders: Array<{
    id: string;
    status: string;
    total: number;
    createdAt: string;
  }>;
  unreadMessages: number;
  cartItemsCount: number;
  recommendations: ClientRecommendation[];
};

export async function buildClientDashboardSummary(
  prisma: PrismaClient,
  userId: string
): Promise<ClientDashboardSummary> {
  const now = new Date();

  const [
    pets,
    upcomingReminders,
    upcomingAppointments,
    recentOrders,
    unreadMessages,
    cart,
    favoritesCount,
  ] = await Promise.all([
    prisma.pet.findMany({
      where: { ownerId: userId, deletedAt: null },
      select: { id: true, name: true, species: true },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.petReminder.findMany({
      where: {
        status: "PENDING",
        dueAt: { gte: now },
        pet: { ownerId: userId, deletedAt: null },
      },
      include: { pet: { select: { name: true } } },
      orderBy: { dueAt: "asc" },
      take: 5,
    }),
    prisma.appointment.findMany({
      where: {
        userId,
        scheduledAt: { gte: now },
        status: { in: ["PENDING", "CONFIRMED", "SCHEDULED"] },
      },
      include: {
        service: { select: { name: true } },
        partner: { select: { name: true, partnerProfile: { select: { businessName: true } } } },
      },
      orderBy: { scheduledAt: "asc" },
      take: 5,
    }),
    prisma.order.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, status: true, total: true, createdAt: true },
    }),
    prisma.message.count({
      where: {
        read: false,
        deletedAt: null,
        senderId: { not: userId },
        conversation: {
          participants: { some: { userId, leftAt: null } },
        },
      },
    }),
    prisma.cart.findFirst({
      where: { userId },
      include: { items: true },
    }),
    prisma.favorite.count({ where: { userId, productId: { not: null } } }),
  ]);

  const recommendations: ClientRecommendation[] = [];

  if (pets.length === 0) {
    recommendations.push({
      id: "register-pet",
      title: "Cadastre seu primeiro pet",
      description: "Organize cuidados, lembretes e agendamentos em um só lugar.",
      href: "/cliente/meu-pet",
    });
  }

  if (upcomingAppointments.length === 0) {
    recommendations.push({
      id: "book-service",
      title: "Agende um serviço",
      description: "Encontre parceiros verificados e marque banho, consulta ou outros serviços.",
      href: "/cliente/explorar",
    });
  }

  if ((cart?.items.length ?? 0) === 0 && recentOrders.length === 0) {
    recommendations.push({
      id: "explore-marketplace",
      title: "Explore o marketplace",
      description: "Produtos de parceiros aprovados e curadoria EcoPet.",
      href: "/cliente/marketplace",
    });
  }

  if (favoritesCount === 0 && recentOrders.length > 0) {
    recommendations.push({
      id: "reorder",
      title: "Veja seus pedidos",
      description: "Acompanhe entregas e histórico de compras.",
      href: "/dashboard/client/orders",
    });
  }

  return {
    pets,
    petsCount: pets.length,
    upcomingReminders: upcomingReminders.map((r) => ({
      id: r.id,
      title: r.title,
      dueAt: r.dueAt.toISOString(),
      petName: r.pet.name,
    })),
    upcomingAppointments: upcomingAppointments.map((a) => ({
      id: a.id,
      scheduledAt: a.scheduledAt.toISOString(),
      status: a.status,
      serviceName: a.service?.name ?? null,
      partnerName: a.partner?.partnerProfile?.businessName ?? a.partner?.name ?? null,
    })),
    recentOrders: recentOrders.map((o) => ({
      id: o.id,
      status: o.status,
      total: o.total,
      createdAt: o.createdAt.toISOString(),
    })),
    unreadMessages,
    cartItemsCount: cart?.items.length ?? 0,
    recommendations,
  };
}
