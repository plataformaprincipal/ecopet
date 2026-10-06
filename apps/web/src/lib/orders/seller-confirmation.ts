import "server-only";

import { OrderStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { COMMERCE_OPS_POLICY, sellerAcceptDeadline } from "@/lib/commerce/ops-policy";
import { partnerRejectOrder } from "@/lib/commerce-chat/order-lifecycle";
import { createInternalNotification } from "@/lib/notifications/internal";
import { writeAuditLog } from "@/lib/audit-log";

export function computeSellerAcceptBy(from = new Date()) {
  return sellerAcceptDeadline(from, COMMERCE_OPS_POLICY.sellerAcceptMs);
}

export async function stampSellerAcceptDeadline(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      partnerId: true,
      sellerAcceptBy: true,
      status: true,
      items: { select: { sku: true, itemType: true, partnerId: true } },
    },
  });
  if (!order?.partnerId || order.sellerAcceptBy) return order;
  const { isEccopetSelfFulfilledItem } = await import("@/lib/commerce/eccopet-access");
  const needsPartner = order.items.some(
    (item) =>
      !isEccopetSelfFulfilledItem({
        sku: item.sku,
        itemType: item.itemType,
        partnerId: item.partnerId ?? order.partnerId,
      })
  );
  if (!needsPartner) return order;
  const sellerAcceptBy = computeSellerAcceptBy();
  return prisma.order.update({
    where: { id: orderId },
    data: { sellerAcceptBy },
    select: { id: true, partnerId: true, sellerAcceptBy: true, status: true },
  });
}

export async function expireUnconfirmedPartnerOrders(limit = 40) {
  const now = new Date();
  const fallbackCutoff = new Date(now.getTime() - COMMERCE_OPS_POLICY.sellerAcceptMs);
  const orders = await prisma.order.findMany({
    where: {
      partnerId: { not: null },
      status: { in: [OrderStatus.PAID, OrderStatus.PENDING_CONFIRMATION] },
      OR: [{ sellerAcceptBy: { lte: now } }, { sellerAcceptBy: null, updatedAt: { lte: fallbackCutoff } }],
    },
    select: { id: true, partnerId: true, userId: true, orderNumber: true },
    take: limit,
    orderBy: { updatedAt: "asc" },
  });

  const expired: string[] = [];
  for (const order of orders) {
    if (!order.partnerId) continue;
    const full = await prisma.order.findUnique({
      where: { id: order.id },
      select: { items: { select: { sku: true, itemType: true, partnerId: true } } },
    });
    const { isEccopetSelfFulfilledItem } = await import("@/lib/commerce/eccopet-access");
    const needsPartner = (full?.items ?? []).some(
      (item) =>
        !isEccopetSelfFulfilledItem({
          sku: item.sku,
          itemType: item.itemType,
          partnerId: item.partnerId ?? order.partnerId,
        })
    );
    if (!needsPartner) continue;
    try {
      await partnerRejectOrder({
        orderId: order.id,
        partnerId: order.partnerId,
        reason: "Prazo de aceite do parceiro expirado. Pedido cancelado automaticamente.",
      });
      await prisma.order.update({
        where: { id: order.id },
        data: {
          statusHistory: {
            create: {
              status: OrderStatus.CANCELLED,
              note: "SELLER_CONFIRMATION_EXPIRED",
            },
          },
        },
      }).catch(() => undefined);
      await createInternalNotification({
        userId: order.userId,
        title: "Pedido cancelado",
        body: `O pedido #${order.orderNumber} foi cancelado porque o parceiro não confirmou no prazo.`,
        type: "ORDER_CANCELLED",
        actionUrl: `/dashboard/client/orders/${order.id}`,
        data: { orderId: order.id, reason: "SELLER_CONFIRMATION_EXPIRED" },
      });
      await writeAuditLog({
        action: "UPDATE",
        module: "commerce.seller_accept",
        resource: "Order",
        resourceId: order.id,
        observation: "SELLER_CONFIRMATION_EXPIRED",
      }).catch(() => undefined);
      expired.push(order.id);
    } catch {
      /* próximo pedido */
    }
  }
  return { scanned: orders.length, expired };
}
