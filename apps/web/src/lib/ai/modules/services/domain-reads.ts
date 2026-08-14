/**
 * Adaptadores de leitura para a IA — apenas services/domínio existentes.
 * Handlers de ferramentas não importam Prisma diretamente.
 */
import "server-only";

import { AccountStatus, VerificationStatus } from "@prisma/client";
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
import { getOrCreateLoyaltyAccount } from "@/lib/loyalty/service";
import { serializeOngListing } from "@/lib/ong/serialize-listing";
import { unpackRequirements } from "@/lib/ong/adoption-listing-meta";
import { vaccinationStatus } from "@/lib/pets/vaccination-status";
import { withAiCache } from "../cache";

const TREND_POST_W = 3;
const TREND_COMMENT_W = 2;
const TREND_LIKE_W = 1;

function formatTrendCount(n: number): string {
  if (n >= 1000) {
    const v = n / 1000;
    return `${v.toFixed(v >= 10 ? 0 : 1).replace(".", ",")} mil`;
  }
  return String(n);
}

function adoptionAgeBucket(age: string | null | undefined): string | null {
  if (!age) return null;
  const n = Number.parseInt(age.replace(/\D/g, ""), 10);
  if (!Number.isFinite(n)) {
    const lower = age.toLowerCase();
    if (lower.includes("filhote") || lower.includes("puppy") || lower.includes("kitten")) return "puppy";
    if (lower.includes("jovem") || lower.includes("young")) return "young";
    if (lower.includes("idoso") || lower.includes("senior")) return "senior";
    if (lower.includes("adulto") || lower.includes("adult")) return "adult";
    return null;
  }
  if (n <= 1) return "puppy";
  if (n <= 3) return "young";
  if (n <= 8) return "adult";
  return "senior";
}

export type AdoptionReadFilters = {
  query?: string;
  species?: string;
  city?: string;
  state?: string;
  sex?: string;
  size?: string;
  age?: string;
};
export async function readPublicProducts(
  query: string,
  opts?: { lat?: number; lng?: number; radiusKm?: number }
) {
  const geoKey =
    opts?.lat != null && opts?.lng != null ? `:geo:${opts.lat.toFixed(3)},${opts.lng.toFixed(3)}` : "";
  const key = `ai:products:${query.toLowerCase().slice(0, 64)}${geoKey}`;
  return withAiCache(key, 30_000, async () => {
    const result = await queryPublicProducts({
      q: query || undefined,
      pageSize: 8,
      lat: opts?.lat,
      lng: opts?.lng,
      radiusKm: opts?.radiusKm ?? 50,
      sort: opts?.lat != null && opts?.lng != null ? "near_me" : undefined,
    });
    return result.products.map((p) => ({
      id: p.id,
      name: p.name,
      price: p.price,
      rating: p.rating,
      brand: p.brand ?? null,
      distanceKm: p.distanceKm ?? null,
      description: typeof p.description === "string" ? p.description.slice(0, 160) : null,
      isSponsored: Boolean(p.isSponsored),
    }));
  });
}

export async function readPublicServices(
  query: string,
  opts?: { lat?: number; lng?: number; radiusKm?: number }
) {
  const geoKey =
    opts?.lat != null && opts?.lng != null ? `:geo:${opts.lat.toFixed(3)},${opts.lng.toFixed(3)}` : "";
  const key = `ai:services:${query.toLowerCase().slice(0, 64)}${geoKey}`;
  return withAiCache(key, 30_000, async () => {
    const result = await queryPublicServices({
      q: query || undefined,
      pageSize: 8,
      lat: opts?.lat,
      lng: opts?.lng,
      radiusKm: opts?.radiusKm ?? 50,
      sort: opts?.lat != null && opts?.lng != null ? "near_me" : undefined,
    });
    return result.services.map((s) => ({
      id: s.id,
      name: s.name,
      price: s.price,
      durationMin: s.durationMin ?? null,
      city: s.city ?? null,
      distanceKm: s.distanceKm ?? null,
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

/** Lista anúncios públicos de adoção — mesma base de /api/public/adoption. */
export async function readAdoptions(filters: AdoptionReadFilters = {}) {
  const species = filters.species?.trim();
  const q = filters.query?.trim();
  const sex = filters.sex?.trim()?.toLowerCase();
  const size = filters.size?.trim()?.toLowerCase();
  const city = filters.city?.trim()?.toLowerCase();
  const state = filters.state?.trim()?.toLowerCase();
  const age = filters.age?.trim()?.toLowerCase();

  const listings = await prisma.adoptionListing.findMany({
    where: {
      status: "AVAILABLE",
      ...(species ? { species: species as never } : {}),
      ...(q ? { name: { contains: q, mode: "insensitive" as const } } : {}),
      ong: {
        accountStatus: "ACTIVE",
        ongProfile: {
          is: {
            verificationStatus: "APPROVED",
            ...(city ? { city: { contains: city, mode: "insensitive" as const } } : {}),
            ...(state ? { state: { equals: state, mode: "insensitive" as const } } : {}),
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 80,
    include: {
      ong: {
        select: {
          id: true,
          name: true,
          ongProfile: { select: { ongName: true, name: true, city: true, state: true } },
        },
      },
    },
  });

  const filtered = listings.filter((l) => {
    const { meta } = unpackRequirements(l.requirements);
    if (meta.unavailable) return false;
    if (sex) {
      const metaSex = (meta.sex || "").toLowerCase();
      if (sex === "unknown") {
        if (metaSex) return false;
      } else if (metaSex !== sex) {
        return false;
      }
    }
    if (size && (meta.size || "").toLowerCase() !== size) return false;
    if (age) {
      const bucket = adoptionAgeBucket(l.age);
      if (bucket && bucket !== age) return false;
      if (!bucket) return false;
    }
    if (city) {
      const listingCity = (meta.city || l.ong.ongProfile?.city || "").toLowerCase();
      if (!listingCity.includes(city)) return false;
    }
    if (state) {
      const listingState = (meta.state || l.ong.ongProfile?.state || "").toLowerCase();
      if (listingState !== state) return false;
    }
    return true;
  });

  return {
    total: filtered.length,
    animals: filtered.slice(0, 8).map((l) => {
      const serialized = serializeOngListing(l);
      return {
        id: serialized.id,
        name: serialized.name,
        species: serialized.species,
        breed: serialized.breed,
        age: serialized.age,
        size: serialized.size,
        sex: serialized.sex,
        city: serialized.city ?? l.ong.ongProfile?.city ?? null,
        state: serialized.state ?? l.ong.ongProfile?.state ?? null,
        vaccinated: serialized.vaccinated,
        neutered: serialized.neutered,
        description:
          typeof serialized.description === "string"
            ? serialized.description.slice(0, 160)
            : null,
        ongName: l.ong.ongProfile?.ongName ?? l.ong.ongProfile?.name ?? l.ong.name,
      };
    }),
  };
}

export async function readLoyalty(userId: string) {
  const account = await getOrCreateLoyaltyAccount(userId);
  return {
    programName: "EccoPontos",
    pointsBalance: account.pointsBalance,
    lifetimePoints: account.lifetimePoints,
    tier: account.tier,
    recentTransactions: account.transactions.slice(0, 8).map((tx) => ({
      id: tx.id,
      type: tx.type,
      points: tx.points,
      sourceType: tx.sourceType,
      description: tx.description,
      createdAt: tx.createdAt.toISOString(),
    })),
  };
}

/** Tendências — mesma lógica de score de /api/public/trending. */
export async function readTrending() {
  return withAiCache("ai:trending:v1", 60_000, async () => {
    const now = new Date();
    const window7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const window30d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    async function scoreHashtags(since: Date) {
      const links = await prisma.socialPostHashtag.findMany({
        where: {
          post: {
            deletedAt: null,
            archivedAt: null,
            status: { in: ["PUBLISHED", "REPORTED"] },
            createdAt: { gte: since },
          },
        },
        select: {
          hashtag: { select: { id: true, name: true, slug: true, usageCount: true } },
          post: {
            select: {
              _count: { select: { likes: true, comments: true } },
            },
          },
        },
        take: 2000,
      });

      const map = new Map<
        string,
        {
          id: string;
          name: string;
          slug: string;
          usageCount: number;
          posts: number;
          comments: number;
          likes: number;
        }
      >();

      for (const row of links) {
        const h = row.hashtag;
        const cur = map.get(h.id) ?? {
          id: h.id,
          name: h.name,
          slug: h.slug,
          usageCount: h.usageCount,
          posts: 0,
          comments: 0,
          likes: 0,
        };
        cur.posts += 1;
        cur.comments += row.post._count.comments;
        cur.likes += row.post._count.likes;
        map.set(h.id, cur);
      }

      return [...map.values()]
        .map((h) => ({
          ...h,
          trendScore: h.posts * TREND_POST_W + h.comments * TREND_COMMENT_W + h.likes * TREND_LIKE_W,
          publicationsLabel: formatTrendCount(h.posts),
        }))
        .sort((a, b) => b.trendScore - a.trendScore || b.posts - a.posts);
    }

    let ranked = await scoreHashtags(window7d);
    let windowUsed: "7d" | "30d" | "all" = "7d";

    if (ranked.length < 5) {
      ranked = await scoreHashtags(window30d);
      windowUsed = "30d";
    }

    if (ranked.length < 3) {
      const fallback = await prisma.hashtag.findMany({
        orderBy: { usageCount: "desc" },
        take: 12,
        select: { id: true, name: true, slug: true, usageCount: true },
      });
      ranked = fallback.map((h) => ({
        id: h.id,
        name: h.name,
        slug: h.slug,
        usageCount: h.usageCount,
        posts: h.usageCount,
        comments: 0,
        likes: 0,
        trendScore: h.usageCount,
        publicationsLabel: formatTrendCount(h.usageCount),
      }));
      windowUsed = "all";
    }

    const trends = ranked.slice(0, 10).map((t, i) => ({
      position: i + 1,
      topic: t.name.startsWith("#") ? t.name : `#${t.name}`,
      slug: t.slug,
      publications: t.posts,
      publicationsLabel: t.publicationsLabel,
      score: t.trendScore,
    }));

    const [partners, products, services, ngos] = await Promise.all([
      queryPublicPartners({ pageSize: 4 }),
      queryPublicProducts({ pageSize: 4 }),
      queryPublicServices({ pageSize: 4 }),
      prisma.user.findMany({
        where: {
          role: "ONG",
          accountStatus: AccountStatus.ACTIVE,
          ongProfile: { is: { verificationStatus: VerificationStatus.APPROVED } },
        },
        select: {
          id: true,
          name: true,
          ongProfile: { select: { city: true, ongName: true, name: true } },
        },
        take: 4,
        orderBy: { createdAt: "desc" },
      }),
    ]);

    return {
      window: windowUsed,
      trends,
      featuredPartners: partners.partners.map((p) => ({
        id: p.id,
        name: p.name,
        city: p.city,
      })),
      featuredProducts: products.products.map((p) => ({
        id: p.id,
        name: p.name,
        price: p.price,
      })),
      featuredServices: services.services.map((s) => ({
        id: s.id,
        name: s.name,
        price: s.price,
      })),
      ngos: ngos.map((n) => ({
        id: n.id,
        name: n.ongProfile?.ongName ?? n.ongProfile?.name ?? n.name,
        city: n.ongProfile?.city ?? null,
      })),
    };
  });
}

export async function readPetVaccinations(
  userId: string,
  opts: { petId?: string; petName?: string } = {}
) {
  const petId = opts.petId?.trim();
  const petName = opts.petName?.trim();

  const pets = await prisma.pet.findMany({
    where: {
      ownerId: userId,
      deletedAt: null,
      ...(petId ? { id: petId } : {}),
      ...(petName && !petId
        ? { name: { contains: petName, mode: "insensitive" as const } }
        : {}),
    },
    select: {
      id: true,
      name: true,
      species: true,
      vaccinations: {
        orderBy: { date: "desc" },
        take: 20,
        select: {
          id: true,
          name: true,
          date: true,
          nextDue: true,
          manufacturer: true,
          veterinarian: true,
        },
      },
    },
    take: 10,
  });

  if (petId && pets.length === 0) {
    return { ok: false as const, error: "Pet não encontrado ou sem permissão.", pets: [] };
  }

  return {
    ok: true as const,
    pets: pets.map((p) => ({
      id: p.id,
      name: p.name,
      species: p.species,
      vaccinations: p.vaccinations.map((v) => ({
        id: v.id,
        name: v.name,
        date: v.date.toISOString(),
        nextDue: v.nextDue?.toISOString() ?? null,
        status: vaccinationStatus(v.nextDue),
        manufacturer: v.manufacturer,
        veterinarian: v.veterinarian,
      })),
    })),
  };
}
