import { createInternalNotification } from "@/lib/notifications/internal";
import { writeAuditLog } from "@/lib/audit-log";

export async function notifyNewMessage(params: {
  recipientId: string;
  senderName: string;
  conversationId: string;
  messageId: string;
  preview: string;
}) {
  return createInternalNotification({
    userId: params.recipientId,
    title: "Nova mensagem",
    body: `${params.senderName}: ${params.preview.slice(0, 120)}`,
    type: "MESSAGE_RECEIVED",
    data: {
      conversationId: params.conversationId,
      messageId: params.messageId,
    },
  });
}

export async function notifySupportTicket(params: {
  recipientId: string;
  title: string;
  body: string;
  ticketId: string;
  type: string;
}) {
  return createInternalNotification({
    userId: params.recipientId,
    title: params.title,
    body: params.body,
    type: params.type,
    data: { ticketId: params.ticketId },
  });
}

export async function auditChatAction(params: {
  actorId: string;
  action: "CREATE" | "UPDATE" | "DELETE" | "MODERATE" | "ASSIGN" | "VIEW";
  resource: string;
  resourceId: string;
  observation?: string;
  entityBefore?: unknown;
  entityAfter?: unknown;
}) {
  await writeAuditLog({
    actorId: params.actorId,
    action: params.action,
    module: "chat",
    resource: params.resource,
    resourceId: params.resourceId,
    observation: params.observation,
    entityBefore: params.entityBefore,
    entityAfter: params.entityAfter,
  });
}
