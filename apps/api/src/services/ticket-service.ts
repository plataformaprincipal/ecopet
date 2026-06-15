import { prisma } from "@ecopet/database";
import type { SupportCategory, TicketPriority, TicketStatus } from "@prisma/client";
import { assignSlaOnCreate, markSlaResponded, markSlaResolved } from "./sla-service.js";
import { emitPlatformEvent } from "./platform-governance-service.js";
export async function listTickets(params: {
  status?: TicketStatus;
  requesterId?: string;
  assigneeId?: string;
  isGestor?: boolean;
}) {
  return prisma.supportTicket.findMany({
    where: {
      ...(params.status ? { status: params.status } : {}),
      ...(params.requesterId ? { requesterId: params.requesterId } : {}),
      ...(params.assigneeId ? { assigneeId: params.assigneeId } : {}),
    },
    orderBy: { createdAt: "desc" },
    include: {
      requester: { select: { id: true, name: true, email: true, role: true } },
      assignee: { select: { id: true, name: true } },
    },
    take: 100,
  });
}

export async function createTicket(params: {
  subject: string;
  description: string;
  category: SupportCategory;
  priority?: TicketPriority;
  requesterId: string;
}) {
  const last = await prisma.supportTicket.findFirst({ orderBy: { number: "desc" }, select: { number: true } });
  const number = (last?.number ?? 1000) + 1;

  const ticket = await prisma.supportTicket.create({
    data: {
      number,
      subject: params.subject,
      description: params.description,
      category: params.category,
      priority: params.priority ?? "NORMAL",
      requesterId: params.requesterId,
    },
    include: {
      requester: { select: { id: true, name: true, email: true, role: true } },
    },
  });

  const sla = await assignSlaOnCreate({
    entityType: "support_ticket",
    entityId: ticket.id,
    priority: params.priority ?? "MEDIUM",
    personaScope: "GLOBAL",
    actorId: params.requesterId,
    metadata: { subject: params.subject, number: ticket.number },
  });

  if (sla) {
    await prisma.supportTicket.update({
      where: { id: ticket.id },
      data: { metadata: { slaRecordId: sla.id } },
    });
  }

  await emitPlatformEvent({
    eventType: "ticket.created",
    personaScope: "GLOBAL",
    actorId: params.requesterId,
    entityType: "support_ticket",
    entityId: ticket.id,
    payload: { number: ticket.number, priority: ticket.priority, category: params.category },
  });

  return ticket;
}

export async function updateTicket(
  id: string,
  data: {
    status?: TicketStatus;
    assigneeId?: string;
    priority?: TicketPriority;
    aiSuggested?: string;
  },
  userId?: string
) {
  const before = await prisma.supportTicket.findUnique({ where: { id } });

  const ticket = await prisma.supportTicket.update({
    where: { id },
    data: {
      ...data,
      ...(data.status === "RESOLVED" || data.status === "CLOSED"
        ? { resolvedAt: new Date() }
        : {}),
    },
    include: {
      requester: { select: { id: true, name: true, email: true, role: true } },
      assignee: { select: { id: true, name: true } },
    },
  });

  if (data.assigneeId && !before?.assigneeId) {
    await markSlaResponded("support_ticket", id, userId);
  }
  if (data.status === "RESOLVED" || data.status === "CLOSED") {
    await markSlaResolved("support_ticket", id, userId);
  }

  return ticket;
}
