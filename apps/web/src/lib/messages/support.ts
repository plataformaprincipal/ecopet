import { prisma } from "@/lib/prisma";
import { requireActiveChatUser, assertAdmin } from "@/lib/messages/permissions";
import { ChatError } from "@/lib/messages/utils";
import { auditChatAction, notifySupportTicket } from "@/lib/messages/notifications";
import type { SupportCategory, TicketPriority, TicketStatus } from "@prisma/client";

async function nextTicketNumber() {
  const last = await prisma.supportTicket.findFirst({ orderBy: { number: "desc" }, select: { number: true } });
  return (last?.number ?? 1000) + 1;
}

export async function listSupportTickets(params: {
  userId: string;
  isAdmin?: boolean;
  status?: TicketStatus;
  q?: string;
  page?: number;
}) {
  const page = Math.max(1, params.page ?? 1);
  const pageSize = 20;
  const where = {
    ...(params.isAdmin ? {} : { requesterId: params.userId }),
    ...(params.status ? { status: params.status } : {}),
    ...(params.q
      ? {
          OR: [
            { subject: { contains: params.q, mode: "insensitive" as const } },
            { description: { contains: params.q, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [items, total] = await Promise.all([
    prisma.supportTicket.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        requester: { select: { id: true, name: true, email: true } },
        assignee: { select: { id: true, name: true, email: true } },
        conversation: { select: { id: true } },
      },
    }),
    prisma.supportTicket.count({ where }),
  ]);

  return { items, total, page, pageSize };
}

export async function createSupportTicket(params: {
  userId: string;
  subject: string;
  description: string;
  category?: SupportCategory;
  priority?: TicketPriority;
}) {
  const user = await requireActiveChatUser(params.userId);
  const number = await nextTicketNumber();

  const ticket = await prisma.$transaction(async (tx) => {
    const created = await tx.supportTicket.create({
      data: {
        number,
        subject: params.subject.trim(),
        description: params.description.trim(),
        category: params.category ?? "OTHER",
        priority: params.priority ?? "NORMAL",
        status: "OPEN",
        requesterId: user.id,
      },
    });

    const conversation = await tx.conversation.create({
      data: {
        type: "SUPPORT",
        status: "OPEN",
        title: `Suporte #${number}`,
        createdById: user.id,
        ticketId: created.id,
        participants: {
          create: [{ userId: user.id, roleSnapshot: user.role }],
        },
      },
    });

    await tx.message.create({
      data: {
        conversationId: conversation.id,
        senderId: user.id,
        content: params.description.trim(),
        type: "TEXT",
      },
    });

    await tx.conversation.update({
      where: { id: conversation.id },
      data: { lastMessageAt: new Date() },
    });

    return { ...created, conversationId: conversation.id };
  });

  const admins = await prisma.user.findMany({
    where: { role: "ADMIN", accountStatus: "ACTIVE" },
    select: { id: true },
    take: 20,
  });

  await Promise.all(
    admins.map((a) =>
      notifySupportTicket({
        recipientId: a.id,
        title: "Novo ticket de suporte",
        body: `#${ticket.number} — ${ticket.subject}`,
        ticketId: ticket.id,
        type: "SUPPORT_TICKET_CREATED",
      }).catch(() => undefined)
    )
  );

  await auditChatAction({
    actorId: user.id,
    action: "CREATE",
    resource: "support_ticket",
    resourceId: ticket.id,
  });

  return ticket;
}

export async function getSupportTicket(ticketId: string, userId: string, isAdmin = false) {
  const ticket = await prisma.supportTicket.findUnique({
    where: { id: ticketId },
    include: {
      requester: { select: { id: true, name: true, email: true, role: true } },
      assignee: { select: { id: true, name: true, email: true } },
      conversation: {
        include: {
          participants: { include: { user: { select: { id: true, name: true, role: true } } } },
        },
      },
    },
  });
  if (!ticket) throw new ChatError("Ticket não encontrado.", "NOT_FOUND", 404);
  if (!isAdmin && ticket.requesterId !== userId) {
    throw new ChatError("Sem permissão.", "FORBIDDEN", 403);
  }
  return ticket;
}

export async function assignSupportTicket(ticketId: string, adminId: string, assigneeId?: string) {
  await assertAdmin(adminId);
  const assignee = assigneeId ?? adminId;
  const conv = await prisma.conversation.findFirst({ where: { ticketId }, select: { id: true } });

  const ticket = await prisma.supportTicket.update({
    where: { id: ticketId },
    data: { assigneeId: assignee, status: "IN_PROGRESS" },
  });

  if (conv) {
    await prisma.conversationParticipant.upsert({
      where: { conversationId_userId: { conversationId: conv.id, userId: assignee } },
      create: { conversationId: conv.id, userId: assignee, roleSnapshot: "ADMIN" },
      update: { leftAt: null },
    });
  }

  await auditChatAction({
    actorId: adminId,
    action: "ASSIGN",
    resource: "support_ticket",
    resourceId: ticketId,
    entityAfter: { assigneeId: assignee },
  });

  return ticket;
}

export async function updateSupportTicketStatus(
  ticketId: string,
  actorId: string,
  status: TicketStatus,
  isAdmin: boolean
) {
  const ticket = await prisma.supportTicket.findUnique({ where: { id: ticketId } });
  if (!ticket) throw new ChatError("Ticket não encontrado.", "NOT_FOUND", 404);
  if (!isAdmin && ticket.requesterId !== actorId) {
    throw new ChatError("Sem permissão.", "FORBIDDEN", 403);
  }
  if (!isAdmin && status !== "CLOSED") {
    throw new ChatError("Usuário só pode fechar o ticket.", "FORBIDDEN", 403);
  }

  const updated = await prisma.supportTicket.update({
    where: { id: ticketId },
    data: {
      status,
      closedAt: status === "CLOSED" ? new Date() : undefined,
      resolvedAt: status === "RESOLVED" || status === "CLOSED" ? new Date() : undefined,
    },
  });

  await auditChatAction({
    actorId,
    action: "UPDATE",
    resource: "support_ticket",
    resourceId: ticketId,
    entityAfter: { status },
  });

  return updated;
}

export async function addAdminToSupportConversation(ticketId: string, adminId: string) {
  const conv = await prisma.conversation.findFirst({ where: { ticketId } });
  if (!conv) return null;
  return prisma.conversationParticipant.upsert({
    where: { conversationId_userId: { conversationId: conv.id, userId: adminId } },
    create: { conversationId: conv.id, userId: adminId, roleSnapshot: "ADMIN" },
    update: { leftAt: null },
  });
}
