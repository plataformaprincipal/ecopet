import { writeAuditLog } from "@/lib/audit-log";
import { prisma } from "@/lib/prisma";
import { assignSupportTicket, updateSupportTicketStatus } from "@/lib/messages/support";
import type { TicketPriority, TicketStatus } from "@prisma/client";
import { loadGovernanceStore, saveGovernanceStore, type IncidentRecord } from "./store";

export async function performSupportGovernanceAction(params: {
  adminId: string;
  ticketId: string;
  action: "assign" | "respond" | "escalate" | "transfer" | "close" | "reopen" | "critical";
  reason: string;
  assigneeId?: string;
  response?: string;
  confirmed?: boolean;
}) {
  if (!params.reason?.trim()) throw new Error("REASON_REQUIRED");

  const ticket = await prisma.supportTicket.findUnique({ where: { id: params.ticketId } });
  if (!ticket) throw new Error("NOT_FOUND");

  const before = { status: ticket.status, priority: ticket.priority, assigneeId: ticket.assigneeId };

  if (params.action === "assign") {
    const updated = await assignSupportTicket(params.ticketId, params.adminId, params.assigneeId);
    await writeAuditLog({
      actorId: params.adminId,
      action: "ASSIGN",
      module: "admin.governance.support",
      resource: "SupportTicket",
      resourceId: params.ticketId,
      entityBefore: before,
      entityAfter: { assigneeId: updated.assigneeId, status: updated.status },
      observation: params.reason.trim(),
    });
    return updated;
  }

  if (params.action === "transfer" && params.assigneeId) {
    const updated = await assignSupportTicket(params.ticketId, params.adminId, params.assigneeId);
    await writeAuditLog({
      actorId: params.adminId,
      action: "ASSIGN",
      module: "admin.governance.support",
      resource: "SupportTicket",
      resourceId: params.ticketId,
      entityBefore: before,
      entityAfter: { assigneeId: params.assigneeId },
      observation: `Transferência: ${params.reason.trim()}`,
    });
    return updated;
  }

  if (params.action === "close") {
    const updated = await updateSupportTicketStatus(params.ticketId, params.adminId, "CLOSED", true);
    await writeAuditLog({
      actorId: params.adminId,
      action: "UPDATE",
      module: "admin.governance.support",
      resource: "SupportTicket",
      resourceId: params.ticketId,
      entityBefore: before,
      entityAfter: { status: "CLOSED" },
      observation: params.reason.trim(),
    });
    return updated;
  }

  if (params.action === "reopen") {
    const updated = await updateSupportTicketStatus(params.ticketId, params.adminId, "OPEN", true);
    await writeAuditLog({
      actorId: params.adminId,
      action: "UPDATE",
      module: "admin.governance.support",
      resource: "SupportTicket",
      resourceId: params.ticketId,
      entityBefore: before,
      entityAfter: { status: "OPEN" },
      observation: params.reason.trim(),
    });
    return updated;
  }

  if (params.action === "escalate") {
    const updated = await prisma.supportTicket.update({
      where: { id: params.ticketId },
      data: { priority: "URGENT", status: "IN_PROGRESS" },
    });
    await writeAuditLog({
      actorId: params.adminId,
      action: "UPDATE",
      module: "admin.governance.support",
      resource: "SupportTicket",
      resourceId: params.ticketId,
      entityBefore: before,
      entityAfter: { priority: "URGENT", escalated: true },
      observation: params.reason.trim(),
      metadata: { riskLevel: "medium" },
    });
    return updated;
  }

  if (params.action === "critical") {
    const updated = await prisma.supportTicket.update({
      where: { id: params.ticketId },
      data: { priority: "URGENT" as TicketPriority },
    });
    await writeAuditLog({
      actorId: params.adminId,
      action: "UPDATE",
      module: "admin.governance.support",
      resource: "SupportTicket",
      resourceId: params.ticketId,
      entityBefore: before,
      entityAfter: { priority: "URGENT", critical: true },
      observation: params.reason.trim(),
      metadata: { riskLevel: "high" },
    });
    return updated;
  }

  if (params.action === "respond" && params.response?.trim()) {
    const conv = await prisma.conversation.findFirst({ where: { ticketId: params.ticketId } });
    if (conv) {
      await prisma.message.create({
        data: {
          conversationId: conv.id,
          senderId: params.adminId,
          content: params.response.trim(),
          type: "TEXT",
        },
      });
      await prisma.conversation.update({ where: { id: conv.id }, data: { lastMessageAt: new Date() } });
    }
    const updated = await prisma.supportTicket.update({
      where: { id: params.ticketId },
      data: { status: "WAITING_USER" as TicketStatus, updatedAt: new Date() },
    });
    await writeAuditLog({
      actorId: params.adminId,
      action: "UPDATE",
      module: "admin.governance.support",
      resource: "SupportTicket",
      resourceId: params.ticketId,
      entityBefore: before,
      entityAfter: { responded: true },
      observation: params.reason.trim(),
    });
    return updated;
  }

  throw new Error("INVALID_ACTION");
}

export async function createIncident(params: {
  adminId: string;
  type: string;
  severity: IncidentRecord["severity"];
  impact?: string;
  reason: string;
  evidence?: string;
}) {
  if (!params.reason?.trim()) throw new Error("REASON_REQUIRED");
  const store = await loadGovernanceStore();
  const incident: IncidentRecord = {
    id: `inc-${Date.now()}`,
    type: params.type,
    severity: params.severity,
    impact: params.impact,
    status: "aberto",
    timeline: [{ at: new Date().toISOString(), note: params.reason.trim() }],
    evidence: params.evidence,
    createdAt: new Date().toISOString(),
    responsibleId: params.adminId,
  };
  store.incidents.unshift(incident);
  await saveGovernanceStore(store);
  await writeAuditLog({
    actorId: params.adminId,
    action: "CREATE",
    module: "admin.governance.incidents",
    resource: "Incident",
    resourceId: incident.id,
    entityAfter: incident,
    observation: params.reason.trim(),
    metadata: { riskLevel: params.severity === "critical" ? "critical" : "medium" },
  });
  return incident;
}

export async function appealWarning(params: {
  warningId: string;
  userId: string;
  note: string;
}) {
  const store = await loadGovernanceStore();
  const warning = store.warnings.find((w) => w.id === params.warningId && w.userId === params.userId);
  if (!warning) throw new Error("NOT_FOUND");
  warning.status = "contestada";
  warning.appealNote = params.note.trim();
  await saveGovernanceStore(store);
  return warning;
}

export async function reviewWarning(params: {
  adminId: string;
  warningId: string;
  decision: "revogada" | "mantida";
  reason: string;
}) {
  if (!params.reason?.trim()) throw new Error("REASON_REQUIRED");
  const store = await loadGovernanceStore();
  const warning = store.warnings.find((w) => w.id === params.warningId);
  if (!warning) throw new Error("NOT_FOUND");
  const before = { ...warning };
  warning.status = params.decision === "revogada" ? "revogada" : "ativa";
  await saveGovernanceStore(store);
  await writeAuditLog({
    actorId: params.adminId,
    action: "MODERATE",
    module: "admin.governance.warnings",
    resource: "UserWarning",
    resourceId: warning.id,
    entityBefore: before,
    entityAfter: warning,
    observation: params.reason.trim(),
  });
  return warning;
}
