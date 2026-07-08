import type { PrismaClient } from "@prisma/client";

/**
 * Pet OS — agregação de dados REAIS do cliente/tutor.
 * Somente dados existentes no banco. Quando não houver dados,
 * os campos retornam vazios/zerados para que a UI mostre estados vazios.
 */

export type PetOsPet = {
  id: string;
  name: string;
  species: string;
  photo: string | null;
};

export type PetOsOverview = {
  today: {
    date: string;
    remindersToday: number;
    appointmentsToday: number;
    medicationsActive: number;
  };
  pets: PetOsPet[];
  petsCount: number;
  upcomingAppointments: Array<{
    id: string;
    scheduledAt: string;
    status: string;
    serviceName: string | null;
    partnerName: string | null;
  }>;
  vaccinesPending: Array<{
    id: string;
    name: string;
    petName: string;
    nextDue: string;
  }>;
  medications: Array<{
    id: string;
    name: string;
    petName: string;
    frequency: string | null;
  }>;
  reminders: Array<{
    id: string;
    title: string;
    dueAt: string;
    petName: string;
  }>;
  weight: {
    petName: string;
    latest: number;
    previous: number | null;
    recordedAt: string;
  } | null;
  iot: {
    devices: Array<{
      id: string;
      name: string;
      deviceType: string;
      status: string;
      battery: number | null;
      lastSyncAt: string | null;
    }>;
    alerts: Array<{
      id: string;
      message: string;
      severity: string;
      createdAt: string;
    }>;
    readings: Array<{
      metricKey: string;
      value: number;
      unit: string | null;
      recordedAt: string;
    }>;
  };
  finance: {
    walletBalance: number;
    spentThisMonth: number;
    savings: number;
    recentOrders: Array<{
      id: string;
      status: string;
      total: number;
      createdAt: string;
    }>;
  };
  gamification: {
    points: number;
    level: number;
    badges: number;
  } | null;
  recommendations: {
    products: Array<{ id: string; name: string; price: number; image: string | null; slug: string | null }>;
    services: Array<{ id: string; name: string; price: number; partnerName: string | null; category: string }>;
  };
  recentActivities: Array<{
    id: string;
    title: string;
    eventType: string;
    petName: string;
    createdAt: string;
  }>;
  unreadMessages: number;
  cartItemsCount: number;
};

function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfToday(): Date {
  const d = new Date();
  d.setHours(23, 59, 59, 999);
  return d;
}

function startOfMonth(): Date {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

export async function buildPetOsOverview(
  prisma: PrismaClient,
  userId: string
): Promise<PetOsOverview> {
  const now = new Date();
  const todayStart = startOfToday();
  const todayEnd = endOfToday();
  const monthStart = startOfMonth();

  const pets = await prisma.pet.findMany({
    where: { ownerId: userId, deletedAt: null },
    select: { id: true, name: true, species: true, photo: true },
    orderBy: { createdAt: "desc" },
  });
  const petIds = pets.map((p) => p.id);

  const [
    remindersToday,
    appointmentsToday,
    medicationsActive,
    upcomingAppointments,
    vaccinesPending,
    medications,
    reminders,
    latestWeights,
    devices,
    walletRow,
    spentAgg,
    savingsAgg,
    recentOrders,
    unreadMessages,
    cart,
    gamification,
  ] = await Promise.all([
    petIds.length
      ? prisma.petReminder.count({
          where: { petId: { in: petIds }, status: "PENDING", dueAt: { gte: todayStart, lte: todayEnd } },
        })
      : Promise.resolve(0),
    prisma.appointment.count({
      where: { userId, scheduledAt: { gte: todayStart, lte: todayEnd } },
    }),
    petIds.length
      ? prisma.medication.count({
          where: {
            petId: { in: petIds },
            startDate: { lte: now },
            OR: [{ endDate: null }, { endDate: { gte: now } }],
          },
        })
      : Promise.resolve(0),
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
    petIds.length
      ? prisma.vaccination.findMany({
          where: { petId: { in: petIds }, nextDue: { gte: now } },
          include: { pet: { select: { name: true } } },
          orderBy: { nextDue: "asc" },
          take: 5,
        })
      : Promise.resolve([]),
    petIds.length
      ? prisma.medication.findMany({
          where: {
            petId: { in: petIds },
            startDate: { lte: now },
            OR: [{ endDate: null }, { endDate: { gte: now } }],
          },
          include: { pet: { select: { name: true } } },
          orderBy: { startDate: "desc" },
          take: 5,
        })
      : Promise.resolve([]),
    petIds.length
      ? prisma.petReminder.findMany({
          where: { petId: { in: petIds }, status: "PENDING", dueAt: { gte: now } },
          include: { pet: { select: { name: true } } },
          orderBy: { dueAt: "asc" },
          take: 5,
        })
      : Promise.resolve([]),
    petIds.length
      ? prisma.petWeightRecord.findMany({
          where: { petId: { in: petIds } },
          include: { pet: { select: { name: true } } },
          orderBy: { recordedAt: "desc" },
          take: 2,
        })
      : Promise.resolve([]),
    prisma.iotDevice.findMany({
      where: { OR: [{ userId }, { ownerId: userId }] },
      select: { id: true, name: true, deviceType: true, status: true, battery: true, lastSyncAt: true },
      orderBy: { lastSyncAt: "desc" },
      take: 12,
    }),
    prisma.wallet.findUnique({ where: { userId }, select: { balance: true } }),
    prisma.order.aggregate({ _sum: { total: true }, where: { userId, createdAt: { gte: monthStart } } }),
    prisma.cashback.aggregate({ _sum: { amount: true }, where: { userId } }),
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
        conversation: { participants: { some: { userId, leftAt: null } } },
      },
    }),
    prisma.cart.findFirst({ where: { userId }, include: { items: true } }),
    prisma.gamificationProfile.findUnique({
      where: { userId },
      select: { points: true, level: true, badges: true },
    }),
  ]);

  const deviceIds = devices.map((d) => d.id);
  const [alerts, readings, recommendedProducts, recommendedServices, recentActivities] = await Promise.all([
    deviceIds.length
      ? prisma.iotAlert.findMany({
          where: { deviceId: { in: deviceIds }, resolved: false },
          orderBy: { createdAt: "desc" },
          take: 8,
        })
      : Promise.resolve([]),
    deviceIds.length
      ? prisma.iotReading.findMany({
          where: { deviceId: { in: deviceIds } },
          orderBy: { recordedAt: "desc" },
          take: 8,
          select: { metricKey: true, value: true, unit: true, recordedAt: true },
        })
      : Promise.resolve([]),
    buildProductRecommendations(prisma, pets),
    buildServiceRecommendations(prisma, pets),
    petIds.length
      ? prisma.petEvent.findMany({
          where: { petId: { in: petIds } },
          include: { pet: { select: { name: true } } },
          orderBy: { createdAt: "desc" },
          take: 8,
        })
      : Promise.resolve([]),
  ]);

  const weight = buildWeight(latestWeights);

  return {
    today: {
      date: now.toISOString(),
      remindersToday,
      appointmentsToday,
      medicationsActive,
    },
    pets: pets.map((p) => ({ id: p.id, name: p.name, species: p.species, photo: p.photo })),
    petsCount: pets.length,
    upcomingAppointments: upcomingAppointments.map((a) => ({
      id: a.id,
      scheduledAt: a.scheduledAt.toISOString(),
      status: a.status,
      serviceName: a.service?.name ?? null,
      partnerName: a.partner?.partnerProfile?.businessName ?? a.partner?.name ?? null,
    })),
    vaccinesPending: vaccinesPending.map((v) => ({
      id: v.id,
      name: v.name,
      petName: v.pet.name,
      nextDue: (v.nextDue as Date).toISOString(),
    })),
    medications: medications.map((m) => ({
      id: m.id,
      name: m.name,
      petName: m.pet.name,
      frequency: m.frequency ?? null,
    })),
    reminders: reminders.map((r) => ({
      id: r.id,
      title: r.title,
      dueAt: r.dueAt.toISOString(),
      petName: r.pet.name,
    })),
    weight,
    iot: {
      devices: devices.map((d) => ({
        id: d.id,
        name: d.name,
        deviceType: d.deviceType,
        status: d.status,
        battery: d.battery ?? null,
        lastSyncAt: d.lastSyncAt ? d.lastSyncAt.toISOString() : null,
      })),
      alerts: alerts.map((a) => ({
        id: a.id,
        message: a.message,
        severity: a.severity,
        createdAt: a.createdAt.toISOString(),
      })),
      readings: readings.map((r) => ({
        metricKey: r.metricKey,
        value: r.value,
        unit: r.unit ?? null,
        recordedAt: r.recordedAt.toISOString(),
      })),
    },
    finance: {
      walletBalance: walletRow?.balance ?? 0,
      spentThisMonth: spentAgg._sum.total ?? 0,
      savings: savingsAgg._sum.amount ?? 0,
      recentOrders: recentOrders.map((o) => ({
        id: o.id,
        status: o.status,
        total: o.total,
        createdAt: o.createdAt.toISOString(),
      })),
    },
    gamification: gamification
      ? {
          points: gamification.points,
          level: gamification.level,
          badges: Array.isArray(gamification.badges) ? gamification.badges.length : 0,
        }
      : null,
    recommendations: { products: recommendedProducts, services: recommendedServices },
    recentActivities: recentActivities.map((e) => ({
      id: e.id,
      title: e.title,
      eventType: e.eventType,
      petName: e.pet.name,
      createdAt: e.createdAt.toISOString(),
    })),
    unreadMessages,
    cartItemsCount: cart?.items.length ?? 0,
  };
}

function buildWeight(
  records: Array<{ weight: number; recordedAt: Date; pet: { name: string } }>
): PetOsOverview["weight"] {
  if (records.length === 0) return null;
  const [latest, previous] = records;
  return {
    petName: latest.pet.name,
    latest: latest.weight,
    previous: previous?.weight ?? null,
    recordedAt: latest.recordedAt.toISOString(),
  };
}

async function buildProductRecommendations(
  prisma: PrismaClient,
  pets: Array<{ species: string }>
): Promise<PetOsOverview["recommendations"]["products"]> {
  const species = Array.from(new Set(pets.map((p) => p.species)));
  const products = await prisma.product.findMany({
    where: species.length
      ? { OR: [{ speciesTarget: { in: species as never } }, { speciesTarget: null }] }
      : undefined,
    orderBy: [{ rating: "desc" }, { reviewCount: "desc" }],
    take: 6,
    select: { id: true, name: true, price: true, images: true, slug: true },
  });
  return products.map((p) => ({
    id: p.id,
    name: p.name,
    price: p.price,
    image: firstImage(p.images),
    slug: p.slug ?? null,
  }));
}

async function buildServiceRecommendations(
  prisma: PrismaClient,
  pets: Array<{ species: string }>
): Promise<PetOsOverview["recommendations"]["services"]> {
  const species = Array.from(new Set(pets.map((p) => p.species)));
  const services = await prisma.service.findMany({
    where: {
      deletedAt: null,
      isActive: true,
      status: "ACTIVE",
      approvalStatus: "APPROVED",
      ...(species.length ? { OR: [{ speciesTarget: { in: species as never } }, { speciesTarget: null }] } : {}),
    },
    orderBy: [{ rating: "desc" }, { reviewCount: "desc" }],
    take: 6,
    select: {
      id: true,
      name: true,
      price: true,
      category: true,
      provider: { select: { name: true, partnerProfile: { select: { businessName: true } } } },
    },
  });
  return services.map((s) => ({
    id: s.id,
    name: s.name,
    price: s.price,
    category: String(s.category),
    partnerName: s.provider?.partnerProfile?.businessName ?? s.provider?.name ?? null,
  }));
}

function firstImage(images: unknown): string | null {
  if (Array.isArray(images) && images.length > 0 && typeof images[0] === "string") {
    return images[0] as string;
  }
  return null;
}
