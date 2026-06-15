import { prisma } from "@/lib/prisma";
import { assertAdmin } from "@/lib/messages/permissions";
import { ChatError } from "@/lib/messages/utils";
import { auditChatAction } from "@/lib/messages/notifications";
import type { MessageReportStatus } from "@prisma/client";

export async function listMessageReports(params: {
  adminId: string;
  status?: MessageReportStatus;
  page?: number;
}) {
  await assertAdmin(params.adminId);
  const page = Math.max(1, params.page ?? 1);
  const pageSize = 20;

  const where = params.status ? { status: params.status } : {};
  const [items, total] = await Promise.all([
    prisma.messageReport.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        reporter: { select: { id: true, name: true, email: true } },
        message: {
          select: {
            id: true,
            content: true,
            deletedAt: true,
            sender: { select: { id: true, name: true } },
          },
        },
        conversation: { select: { id: true, type: true, title: true } },
      },
    }),
    prisma.messageReport.count({ where }),
  ]);

  return { items, total, page, pageSize };
}

export async function getMessageReport(reportId: string, adminId: string) {
  await assertAdmin(adminId);
  const report = await prisma.messageReport.findUnique({
    where: { id: reportId },
    include: {
      reporter: { select: { id: true, name: true, email: true } },
      reviewedBy: { select: { id: true, name: true } },
      message: true,
      conversation: true,
    },
  });
  if (!report) throw new ChatError("Denúncia não encontrada.", "NOT_FOUND", 404);
  return report;
}

export async function reviewMessageReport(params: {
  reportId: string;
  adminId: string;
  status: MessageReportStatus;
  resolution?: string;
  hideMessage?: boolean;
  blockConversation?: boolean;
}) {
  await assertAdmin(params.adminId);

  const report = await prisma.messageReport.update({
    where: { id: params.reportId },
    data: {
      status: params.status,
      resolution: params.resolution,
      reviewedById: params.adminId,
      reviewedAt: new Date(),
    },
  });

  if (params.hideMessage) {
    await prisma.message.update({
      where: { id: report.messageId },
      data: { deletedAt: new Date(), content: "[Mensagem ocultada pela moderação]" },
    });
  }

  if (params.blockConversation) {
    await prisma.conversation.update({
      where: { id: report.conversationId },
      data: { status: "BLOCKED", blockedAt: new Date() },
    });
  }

  await auditChatAction({
    actorId: params.adminId,
    action: "MODERATE",
    resource: "message_report",
    resourceId: params.reportId,
    observation: params.resolution,
    entityAfter: { status: params.status },
  });

  return report;
}
