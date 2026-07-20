/**
 * Adaptadores de leitura para a IA — apenas services/domínio existentes.
 * Handlers de ferramentas não importam Prisma diretamente.
 */
import "server-only";

import { prisma } from "@/lib/prisma";
import {
  queryPublicProducts,
  queryPublicServices,
  queryPublicPartners,
} from "@/lib/marketplace/public-query";
import { getOrCreateCart, serializeCart } from "@/lib/cart/cart-service";
import { listNotifications, getUnreadCount } from "@/lib/notifications/notification-service";
import { buildPetOsOverview } from "@/lib/client/petos-overview";
import { buildPartnerDashboardSummary } from "@/lib/partner/ai-insights";
import { buildOngDashboardSummary } from "@/lib/ong/ai-insights";
import { searchSocial } from "@/lib/social/search";
import { withAiCache } from "../cache";

export async function readPublicProducts(query: string) {
  const key = `ai:products:${query.toLowerCase().slice(0, 64)}`;
  return withAiCache(key, 30_000, async () => {
    const result = await queryPublicProducts({ q: query || undefined, pageSize: 8 });
    return result.products.map((p) => ({
      id: p.id,
      name: p.name,
      price: p.price,
      rating: p.rating,
      brand: p.brand ?? null,
      description: typeof p.description === "string" ? p.description.slice(0, 160) : null,
      isSponsored: Boolean(p.isSponsored),
    }));
  });
}

export async function readPublicServices(query: string) {
  const key = `ai:services:${query.toLowerCase().slice(0, 64)}`;
  return withAiCache(key, 30_000, async () => {
    const result = await queryPublicServices({ q: query || undefined, pageSize: 8 });
    return result.services.map((s) => ({
      id: s.id,
      name: s.name,
      price: s.price,
      durationMin: s.durationMin ?? null,
      city: s.city ?? null,
      description: typeof s.description === "string" ? s.description.slice(0, 160) : null,
      partnerName: s.provider?.partnerProfile?.businessName ?? s.provider?.name ?? null,
    }));
  });
}

export async function readPublicPartners(query: string) {
  const result = await queryPublicPartners({ q: query || undefined, pageSize: 6 });
  return result.partners.map((p) => ({
    id: p.id,
    name: p.name,
    city: p.city,
    state: p.state,
    productCount: p.productCount,
    serviceCount: p.serviceCount,
  }));
}

export async function readUserCart(userId: string) {
  const cart = await getOrCreateCart(userId);
  const serialized = serializeCart(cart);
  return {
    itemCount: serialized.itemCount,
    subtotal: serialized.subtotal,
    items: serialized.items.map((i) => ({
      productId: i.productId,
      name: i.name,
      quantity: i.quantity,
      unitPrice: i.unitPrice,
      stock: i.stock,
    })),
  };
}

export async function readUserOrders(userId: string) {
  const orders = await prisma.order.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 8,
    select: {
      id: true,
      status: true,
      total: true,
      createdAt: true,
      items: { select: { name: true, quantity: true, price: true }, take: 5 },
    },
  });
  return orders.map((o) => ({
    id: o.id,
    status: o.status,
    total: o.total,
    createdAt: o.createdAt.toISOString(),
    items: o.items.map((i) => ({
      name: i.name,
      quantity: i.quantity,
      price: i.price,
    })),
  }));
}

export async function readOrderById(userId: string, orderId: string) {
  const order = await prisma.order.findFirst({
    where: { id: orderId, userId },
    select: {
      id: true,
      status: true,
      total: true,
      createdAt: true,
      updatedAt: true,
      items: { select: { name: true, quantity: true, price: true } },
    },
  });
  if (!order) return null;
  return {
    id: order.id,
    status: order.status,
    total: order.total,
    createdAt: order.createdAt.toISOString(),
    items: order.items.map((i) => ({
      name: i.name,
      quantity: i.quantity,
      price: i.price,
    })),
  };
}

export async function readPetOverview(userId: string) {
  const overview = await buildPetOsOverview(prisma, userId);
  return {
    petsCount: overview.petsCount,
    pets: overview.pets.map((p) => ({
      id: p.id,
      name: p.name,
      species: p.species,
    })),
    upcomingAppointments: overview.upcomingAppointments.slice(0, 5),
    vaccinesPending: overview.vaccinesPending.slice(0, 5).map((v) => ({
      name: v.name,
      petName: v.petName,
      nextDue: v.nextDue,
    })),
    medications: overview.medications.slice(0, 5).map((m) => ({
      name: m.name,
      petName: m.petName,
      frequency: m.frequency,
    })),
    reminders: overview.reminders.slice(0, 5).map((r) => ({
      title: r.title,
      dueAt: r.dueAt,
      petName: r.petName,
    })),
  };
}

export async function readUserAgenda(userId: string) {
  const rows = await prisma.appointment.findMany({
    where: {
      OR: [{ userId }, { partnerId: userId }],
      scheduledAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
    },
    orderBy: { scheduledAt: "asc" },
    take: 10,
    select: {
      id: true,
      status: true,
      scheduledAt: true,
      serviceType: true,
      petId: true,
    },
  });
  return rows.map((a) => ({
    id: a.id,
    status: a.status,
    scheduledAt: a.scheduledAt.toISOString(),
    serviceType: a.serviceType,
    petId: a.petId,
  }));
}

export async function readSafeProfile(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, username: true, role: true, createdAt: true },
  });
  if (!user) return null;
  return {
    id: user.id,
    name: user.name,
    username: user.username,
    role: user.role,
    memberSince: user.createdAt.toISOString(),
  };
}

export async function readNotifications(userId: string) {
  const [list, unread] = await Promise.all([
    listNotifications({ userId, limit: 8 }),
    getUnreadCount(userId),
  ]);
  return {
    unread,
    items: list.notifications.map((n) => ({
      id: n.id,
      title: n.title,
      message: n.message?.slice(0, 200) ?? null,
      createdAt: n.createdAt,
      read: n.read,
    })),
  };
}

export async function readPartnerSummary(partnerId: string) {
  const summary = await buildPartnerDashboardSummary(prisma, partnerId);
  return {
    productsActive: summary.stats.productsActive,
    servicesActive: summary.stats.servicesActive,
    ordersCount: summary.stats.ordersCount,
    appointmentsPending: summary.stats.appointmentsPending,
    pendingMessages: summary.pendingMessages,
    recentOrders: summary.recentOrders.slice(0, 5).map((o) => ({
      id: o.id,
      status: o.status,
      total: o.total,
      createdAt: o.createdAt,
    })),
    recentAppointments: summary.recentAppointments.slice(0, 5).map((a) => ({
      id: a.id,
      status: a.status,
      scheduledAt: a.scheduledAt,
      serviceName: a.serviceName,
    })),
    recentReviews: summary.recentReviews.slice(0, 3).map((r) => ({
      rating: r.rating,
      comment: r.comment?.slice(0, 120) ?? null,
    })),
  };
}

export async function readNgoSummary(ongId: string) {
  const summary = await buildOngDashboardSummary(prisma, ongId);
  return {
    animalsCount: summary.animalsCount,
    availableAnimals: summary.availableAnimals,
    adoptionsInProgress: summary.adoptionsInProgress,
    campaignsActive: summary.campaignsActive,
    adoptionRequestsPending: summary.adoptionRequestsPending,
    recentAnimals: summary.recentAnimals.slice(0, 5),
    recentRequests: summary.recentRequests.slice(0, 5).map((r) => ({
      id: r.id,
      animalName: r.animalName,
      status: r.status,
      createdAt: r.createdAt,
    })),
  };
}

export async function readSocialSearch(userId: string, query: string) {
  const result = await searchSocial({ q: query, viewerId: userId, limit: 8 });
  return {
    hashtags: result.hashtags,
    profiles: result.profiles,
    postsCount: Array.isArray(result.posts) ? result.posts.length : 0,
  };
}
