import { dispatchNotification } from "@/lib/notifications/notification-dispatcher";
import { normalizeNotificationType } from "@/lib/notifications/type-mapper";

/**
 * Cria notificação in-app e dispara push (FCM/Web Push) via orquestrador único.
 * E-mail/SMS/WhatsApp permanecem off por padrão neste atalho (evita fan-out acidental).
 * Preferências do usuário ainda são respeitadas no canal push.
 */
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

  const type = normalizeNotificationType(params.type);
  const idempotencyKey =
    typeof metadata?.idempotencyKey === "string"
      ? metadata.idempotencyKey
      : typeof metadata?.eventId === "string"
        ? `event:${metadata.eventId}`
        : undefined;

  const result = await dispatchNotification({
    userId: params.userId,
    role: params.role,
    type,
    title: params.title,
    message: params.body,
    actionUrl,
    metadata: {
      ...metadata,
      type,
      idempotencyKey,
    },
    priority: params.priority,
    channels: {
      inApp: true,
      push: true,
      email: false,
      sms: false,
      whatsapp: false,
    },
  });

  return result.notificationId
    ? { id: result.notificationId }
    : null;
}

export { createNotification, createBulkNotifications } from "@/lib/notifications/notification-service";
