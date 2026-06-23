import { createNotification as createNotificationCore } from "@/lib/notifications/notification-service";
import { normalizeNotificationType } from "@/lib/notifications/type-mapper";

/** @deprecated Use createNotification from notification-service */
export async function createInternalNotification(params: {
  userId: string;
  title: string;
  body: string;
  type: string;
  data?: Record<string, unknown>;
  actionUrl?: string;
  role?: import("@prisma/client").UserRole;
  priority?: import("@prisma/client").NotificationPriority;
}) {
  const metadata = params.data ? { ...params.data } : undefined;
  const actionUrl =
    params.actionUrl ??
    (typeof metadata?.link === "string" ? metadata.link : undefined) ??
    (typeof metadata?.actionUrl === "string" ? metadata.actionUrl : undefined);

  return createNotificationCore({
    userId: params.userId,
    role: params.role,
    type: normalizeNotificationType(params.type),
    title: params.title,
    message: params.body,
    actionUrl,
    metadata,
    priority: params.priority,
  });
}

export { createNotification, createBulkNotifications } from "@/lib/notifications/notification-service";
