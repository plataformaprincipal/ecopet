import "server-only";

import { OrderStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ChatError } from "@/lib/messages/utils";
import { AFTERCARE_REASONS, AFTERCARE_STATUSES, type AftercareReason, type AftercareStatus } from "@/lib/commerce/ops-policy";
import { createInternalNotification } from "@/lib/notifications/internal";
import { writeAuditLog } from "@/lib/audit-log";

function protocolFor(orderNumber: number) {
  return `EP-${orderNumber}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

export async function openAftercareCase(params: {
  orderId: string;
  buyerId: string;
  itemId?: string | null;
  reason: string;
  description: string;
  requestedResolution?: string;
  attachments?: unknown;
}) {
  if (!(AFTERCARE_REASONS as readonly string[]).includes(params.reason)) {
    throw new ChatError("Motivo inválido.", "VALIDATION", 400);
  }
  const order = await prisma.order.findFirst({
    where: { id: params.orderId, userId: params.buyerId },
    include: { items: true },
  });
  if (!order) throw new ChatError("Pedido não encontrado.", "NOT_FOUND", 404);

  const existing = await prisma.commerceCase.findFirst({
    where: { orderId: order.id, buyerId: params.buyerId, status: { notIn: ["CLOSED", "REJECTED", "REFUNDED"] } },
  });
  if (existing) return existing;

  const created = await prisma.commerceCase.create({
    data: {
      protocol: protocolFor(order.orderNumber),
      orderId: order.id,
      itemId: params.itemId ?? null,
      buyerId: params.buyerId,
      sellerId: order.partnerId,
      reason: params.reason as AftercareReason,
      description: params.description.slice(0, 4000),
      requestedResolution: (params.requestedResolution ?? params.reason).slice(0, 40),
      status: "OPEN",
      attachments: params.attachments as object | undefined,
    },
  });

  await prisma.order.update({
    where: { id: order.id },
    data: {
      statusHistory: {
        create: { status: order.status, note: `Pós-venda ${created.protocol}: ${params.reason}` },
      },
    },
  });

  if (order.partnerId) {
    await createInternalNotification({
      userId: order.partnerId,
      title: "Solicitação de pós-venda",
      body: `Protocolo ${created.protocol} no pedido #${order.orderNumber}.`,
      type: "ORDER_STATUS_UPDATED",
      actionUrl: `/dashboard/partner/orders/${order.id}`,
      data: { orderId: order.id, caseId: created.id, protocol: created.protocol },
    });
  }

  await writeAuditLog({
    actorId: params.buyerId,
    action: "CREATE",
    module: "commerce.aftercare",
    resource: "CommerceCase",
    resourceId: created.id,
    metadata: { orderId: order.id, reason: params.reason, protocol: created.protocol },
  }).catch(() => undefined);

  return created;
}

export async function listAftercareCases(params: { buyerId?: string; sellerId?: string; admin?: boolean }) {
  return prisma.commerceCase.findMany({
    where: params.admin
      ? {}
      : params.buyerId
        ? { buyerId: params.buyerId }
        : params.sellerId
          ? { sellerId: params.sellerId }
          : { id: "__none__" },
    include: { order: { select: { orderNumber: true, status: true, total: true } } },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
}

export async function updateAftercareCase(params: {
  caseId: string;
  actorId: string;
  role: "buyer" | "seller" | "admin";
  status: AftercareStatus;
  note?: string;
}) {
  if (!(AFTERCARE_STATUSES as readonly string[]).includes(params.status)) {
    throw new ChatError("Status inválido.", "VALIDATION", 400);
  }
  const row = await prisma.commerceCase.findUnique({ where: { id: params.caseId } });
  if (!row) throw new ChatError("Solicitação não encontrada.", "NOT_FOUND", 404);
  if (params.role === "buyer" && row.buyerId !== params.actorId) {
    throw new ChatError("Forbidden.", "FORBIDDEN", 403);
  }
  if (params.role === "seller" && row.sellerId !== params.actorId) {
    throw new ChatError("Forbidden.", "FORBIDDEN", 403);
  }

  const updated = await prisma.commerceCase.update({
    where: { id: row.id },
    data: {
      status: params.status,
      closedAt: params.status === "CLOSED" || params.status === "REFUNDED" || params.status === "REJECTED" ? new Date() : row.closedAt,
    },
  });

  await prisma.order.update({
    where: { id: row.orderId },
    data: {
      statusHistory: {
        create: {
          status: OrderStatus.PAID,
          note: `Pós-venda ${row.protocol}: ${params.status}${params.note ? ` — ${params.note}` : ""}`,
        },
      },
    },
  }).catch(() => undefined);

  return updated;
}
