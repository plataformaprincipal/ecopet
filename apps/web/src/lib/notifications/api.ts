import type { Notification, NotificationPreferences, ChannelStatus } from "./types";
import { typeToCategory } from "./types";

type ApiNotification = {
  id: string;
  type: import("@prisma/client").NotificationType;
  title: string;
  message: string;
  actionUrl?: string | null;
  metadata?: Record<string, unknown> | null;
  priority: import("@prisma/client").NotificationPriority;
  read: boolean;
  readAt?: string | null;
  createdAt: string;
};

type ApiListResponse = {
  notifications: ApiNotification[];
  nextCursor: string | null;
};

async function notificationsFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    credentials: "include",
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok || body.success === false) {
    throw new Error(body.error?.message ?? `Erro ${res.status}`);
  }
  return body.data as T;
}

function mapNotification(n: ApiNotification): Notification {
  const actionUrl = n.actionUrl ?? (typeof n.metadata?.link === "string" ? n.metadata.link : undefined);
  return {
    id: n.id,
    type: n.type,
    category: typeToCategory(n.type),
    title: n.title,
    description: n.message,
    createdAt: n.createdAt,
    read: n.read,
    priority: n.priority,
    actionUrl,
    action: actionUrl ? { label: "notifications.actions.viewDetails", href: actionUrl } : undefined,
    meta: n.metadata ?? undefined,
  };
}

export async function fetchNotifications(params?: {
  cursor?: string;
  read?: "read" | "unread";
  type?: string;
}): Promise<{ items: Notification[]; nextCursor: string | null; isDemo: boolean }> {
  const q = new URLSearchParams();
  if (params?.cursor) q.set("cursor", params.cursor);
  if (params?.read) q.set("read", params.read);
  if (params?.type) q.set("type", params.type);
  const suffix = q.toString() ? `?${q}` : "";
  const data = await notificationsFetch<ApiListResponse>(`/api/notifications${suffix}`);
  return {
    items: data.notifications.map(mapNotification),
    nextCursor: data.nextCursor,
    isDemo: false,
  };
}

export async function fetchUnreadCount(): Promise<number> {
  const data = await notificationsFetch<{ count: number }>("/api/notifications/unread-count");
  return data.count;
}

export async function markNotificationReadApi(id: string): Promise<void> {
  await notificationsFetch(`/api/notifications/${id}/read`, { method: "PATCH", body: "{}" });
}

export async function markAllNotificationsReadApi(): Promise<void> {
  await notificationsFetch("/api/notifications/read-all", { method: "PATCH", body: "{}" });
}

export async function deleteNotificationApi(id: string): Promise<void> {
  await notificationsFetch(`/api/notifications/${id}`, { method: "DELETE" });
}

export async function fetchNotificationPreferences(): Promise<{
  preferences: NotificationPreferences;
  channels: ChannelStatus;
}> {
  return notificationsFetch("/api/notifications/preferences");
}

export async function updateNotificationPreferences(
  prefs: Partial<NotificationPreferences>
): Promise<{ preferences: NotificationPreferences; channels: ChannelStatus }> {
  return notificationsFetch("/api/notifications/preferences", {
    method: "PUT",
    body: JSON.stringify(prefs),
  });
}

export async function fetchAiSummary(): Promise<null> {
  return null;
}
