import type { NotificationType, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  type CreateNotificationInput,
  extractActionUrl,
  normalizeNotificationType,
  typeToPreferenceKey,
} from "@/lib/notifications/type-mapper";

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;

export async function getOrCreatePreferences(userId: string) {
  return prisma.notificationPreference.upsert({
    where: { userId },
    create: { userId },
    update: {},
  });
}

async function shouldDeliverInApp(userId: string, type: NotificationType): Promise<boolean> {
  const prefs = await getOrCreatePreferences(userId);
  if (!prefs.inAppEnabled) return false;
  if (type === "SECURITY") return true;
  const key = typeToPreferenceKey(type);
  return Boolean(prefs[key]);
}

export async function createNotification(input: CreateNotificationInput) {
  const type = normalizeNotificationType(input.type);
  const canDeliver = await shouldDeliverInApp(input.userId, type);
  if (!canDeliver) return null;

  let role = input.role;
  if (!role) {
    const user = await prisma.user.findUnique({ where: { id: input.userId }, select: { role: true } });
    role = user?.role;
  }

  const actionUrl = extractActionUrl(input.metadata, input.actionUrl);
  const metadata = input.metadata ? JSON.parse(JSON.stringify(input.metadata)) : undefined;

  return prisma.notification.create({
    data: {
      userId: input.userId,
      role,
      type,
      title: input.title,
      message: input.message,
      body: input.message,
      actionUrl,
      metadata,
      data: metadata,
      priority: input.priority ?? "NORMAL",
    },
  });
}

export async function createBulkNotifications(inputs: CreateNotificationInput[]) {
  const results = [];
  for (const input of inputs) {
    const row = await createNotification(input);
    if (row) results.push(row);
  }
  return results;
}

export function serializeNotification(n: {
  id: string;
  userId: string;
  role: string | null;
  type: NotificationType;
  title: string;
  message: string;
  actionUrl: string | null;
  metadata: unknown;
  priority: string;
  readAt: Date | null;
  read: boolean;
  createdAt: Date;
  updatedAt: Date;
}) {
  const isRead = Boolean(n.readAt) || n.read;
  return {
    id: n.id,
    userId: n.userId,
    role: n.role,
    type: n.type,
    title: n.title,
    message: n.message,
    actionUrl: n.actionUrl,
    metadata: (n.metadata as Record<string, unknown> | null) ?? null,
    priority: n.priority,
    read: isRead,
    readAt: n.readAt?.toISOString() ?? null,
    createdAt: n.createdAt.toISOString(),
    updatedAt: n.updatedAt.toISOString(),
  };
}

export async function listNotifications(params: {
  userId: string;
  cursor?: string;
  limit?: number;
  read?: "read" | "unread";
  type?: NotificationType;
}) {
  const limit = Math.min(params.limit ?? DEFAULT_LIMIT, MAX_LIMIT);
  const where: Prisma.NotificationWhereInput = {
    userId: params.userId,
    deletedAt: null,
  };

  if (params.read === "read") {
    where.OR = [{ readAt: { not: null } }, { read: true }];
  }
  if (params.read === "unread") {
    where.AND = [{ readAt: null }, { read: false }];
  }
  if (params.type) where.type = params.type;

  const rows = await prisma.notification.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: limit + 1,
    ...(params.cursor ? { cursor: { id: params.cursor }, skip: 1 } : {}),
  });

  const hasMore = rows.length > limit;
  const slice = hasMore ? rows.slice(0, limit) : rows;

  return {
    notifications: slice.map(serializeNotification),
    nextCursor: hasMore ? slice[slice.length - 1]?.id ?? null : null,
  };
}

export async function getUnreadCount(userId: string) {
  return prisma.notification.count({
    where: { userId, deletedAt: null, readAt: null, read: false },
  });
}

export async function markAsRead(notificationId: string, userId: string) {
  const now = new Date();
  const result = await prisma.notification.updateMany({
    where: { id: notificationId, userId, deletedAt: null },
    data: { read: true, readAt: now },
  });
  if (result.count === 0) return null;
  const row = await prisma.notification.findFirst({ where: { id: notificationId, userId } });
  return row ? serializeNotification(row) : null;
}

export async function markAllAsRead(userId: string) {
  const now = new Date();
  await prisma.notification.updateMany({
    where: { userId, deletedAt: null, readAt: null, read: false },
    data: { read: true, readAt: now },
  });
  return getUnreadCount(userId);
}

export async function softDeleteNotification(notificationId: string, userId: string) {
  const result = await prisma.notification.updateMany({
    where: { id: notificationId, userId, deletedAt: null },
    data: { deletedAt: new Date() },
  });
  return result.count > 0;
}

export async function updatePreferences(
  userId: string,
  data: Partial<Omit<import("@prisma/client").NotificationPreference, "id" | "userId" | "createdAt" | "updatedAt">>
) {
  const sanitized = { ...data };
  if (sanitized.securityUpdates === false) {
    sanitized.securityUpdates = true;
  }
  return prisma.notificationPreference.upsert({
    where: { userId },
    create: { userId, ...sanitized },
    update: sanitized,
  });
}

export async function getChannelStatus() {
  const { getNotificationChannelProviders } = await import("@/lib/notifications/channels");
  const providers = getNotificationChannelProviders();
  const status: Record<string, boolean> = {};
  for (const p of providers) {
    status[p.channel] = await p.isConfigured();
  }
  return status;
}
