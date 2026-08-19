import { TicketStatus, UserRole } from "@prisma/client";
import { apiSuccess } from "@/lib/api-response";
import { requireAuth } from "@/lib/auth/require-auth";
import { handleChatRouteError } from "@/lib/messages/api-handler";
import {
  assignSupportTicket,
  getSupportTicket,
  updateSupportTicketStatus,
  addAdminToSupportConversation,
} from "@/lib/messages/support";
import { sendMessage } from "@/lib/messages/messages";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ ticketId: string }> };

export async function POST(req: Request, { params }: Params) {
  try {
    const { user, error } = await requireAuth();
    if (error) return error;
    const { ticketId } = await params;
    const isAdmin = user!.role === UserRole.ADMIN;
    const ticket = await getSupportTicket(ticketId, user!.id, isAdmin);
    const body = await req.json();
    const conv = ticket.conversation;
    if (!conv) return handleChatRouteError(new Error("Conversa não vinculada"));

    if (isAdmin) await addAdminToSupportConversation(ticketId, user!.id);

    const isInternal = Boolean(isAdmin && body.internal === true);
    const message = await sendMessage({
      conversationId: conv.id,
      senderId: user!.id,
      content: body.content,
      type: isInternal ? "SYSTEM" : undefined,
      metadata: isInternal ? { visibility: "internal", kind: "admin_note" } : undefined,
    });
    if (isAdmin && !isInternal && ticket.requesterId) {
      const { notifySupportTicket } = await import("@/lib/messages/notifications");
      await notifySupportTicket({
        recipientId: ticket.requesterId,
        title: "A equipe EccoPet respondeu.",
        body: `Protocolo EP-${ticket.number}: a equipe respondeu ao seu chamado.`,
        ticketId,
        type: "SUPPORT_TICKET_REPLY",
      }).catch(() => undefined);
    }
    return apiSuccess({ message }, 201);
  } catch (e) {
    return handleChatRouteError(e);
  }
}

export async function PATCH(req: Request, { params }: Params) {
  try {
    const { user, error } = await requireAuth();
    if (error) return error;
    const { ticketId } = await params;
    const body = await req.json();
    const isAdmin = user!.role === UserRole.ADMIN;

    if (body.action === "assign" && isAdmin) {
      const ticket = await assignSupportTicket(ticketId, user!.id, body.assigneeId);
      return apiSuccess({ ticket });
    }

    if (body.priority && isAdmin) {
      const { prisma } = await import("@/lib/prisma");
      const { auditChatAction } = await import("@/lib/messages/notifications");
      const ticket = await prisma.supportTicket.update({
        where: { id: ticketId },
        data: { priority: body.priority },
      });
      await auditChatAction({
        actorId: user!.id,
        action: "UPDATE",
        resource: "support_ticket",
        resourceId: ticketId,
        entityAfter: { priority: body.priority },
      });
      return apiSuccess({ ticket });
    }

    if (body.status) {
      const ticket = await updateSupportTicketStatus(
        ticketId,
        user!.id,
        body.status as TicketStatus,
        isAdmin
      );
      return apiSuccess({ ticket });
    }

    return handleChatRouteError(new Error("Ação inválida"));
  } catch (e) {
    return handleChatRouteError(e);
  }
}
