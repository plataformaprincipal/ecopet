import { prisma } from "@/lib/prisma";

export type SavePushSubscriptionInput = {
  userId: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  userAgent?: string | null;
};

export async function saveSubscription(input: SavePushSubscriptionInput) {
  const { userId, endpoint, p256dh, auth, userAgent } = input;
  return prisma.pushSubscription.upsert({
    where: { endpoint },
    create: {
      userId,
      endpoint,
      p256dh,
      auth,
      userAgent: userAgent ?? null,
    },
    update: {
      userId,
      p256dh,
      auth,
      userAgent: userAgent ?? null,
      revokedAt: null,
    },
  });
}

export async function revokeSubscription(userId: string, endpoint: string) {
  const result = await prisma.pushSubscription.updateMany({
    where: { userId, endpoint, revokedAt: null },
    data: { revokedAt: new Date() },
  });
  return result.count > 0;
}

export async function listActive(userId: string) {
  return prisma.pushSubscription.findMany({
    where: { userId, revokedAt: null },
    orderBy: { updatedAt: "desc" },
  });
}
