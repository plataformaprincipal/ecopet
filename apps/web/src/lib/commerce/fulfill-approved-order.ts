import "server-only";

import { OrderStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { grantEntitlementsForPaidOrder } from "@/lib/ai-commerce/entitlement-service";
import { grantCatalogPurchase } from "@/lib/commerce-catalog/fulfill";
import { isEccopetSelfFulfilledItem, isDigitalEccopetItemType } from "@/lib/commerce/eccopet-access";
import { writeAuditLog } from "@/lib/audit-log";

const inFlight = new Map<string, Promise<{ ok: true; created: number; fulfillmentError?: string }>>();

/**
 * Fulfillment canônico pós-APPROVED (webhook e polling).
 * Idempotente. Não cobra, não cria Order Mercado Pago, não duplica entitlement.
 */
export async function fulfillApprovedOrder(orderId: string, paymentId?: string | null) {
  const pending = inFlight.get(orderId);
  if (pending) return pending;
  const run = fulfillApprovedOrderOnce(orderId, paymentId).finally(() => inFlight.delete(orderId));
  inFlight.set(orderId, run);
  return run;
}

async function fulfillApprovedOrderOnce(orderId: string, paymentId?: string | null) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: true,
      payments: { orderBy: { createdAt: "desc" }, take: 8 },
    },
  });
  if (!order) return { ok: true as const, created: 0 };

  const approved =
    order.payments.find((p) => p.status === "APPROVED") ??
    (paymentId ? order.payments.find((p) => p.id === paymentId && p.status === "APPROVED") : undefined);
  const paid = order.status === OrderStatus.PAID || Boolean(approved);
  if (!paid) return { ok: true as const, created: 0 };

  const platformItems = order.items.filter((item) =>
    isEccopetSelfFulfilledItem({
      sku: item.sku,
      itemType: item.itemType,
      partnerId: item.partnerId,
    })
  );
  if (!platformItems.length) {
    return { ok: true as const, created: 0 };
  }

  let created = 0;
  let fulfillmentError: string | undefined;
  const paymentRef = approved?.id ?? paymentId ?? null;
  try {
    const ai = await grantEntitlementsForPaidOrder(orderId, paymentRef);
    created += ai.created;
    const catalog = await grantCatalogPurchase({ orderId, paymentId: paymentRef });
    created += catalog.created;
  } catch (error) {
    fulfillmentError = error instanceof Error ? error.message : "FULFILLMENT_ERROR";
    await writeAuditLog({
      action: "UPDATE",
      module: "commerce.fulfillment",
      resource: "Order",
      resourceId: orderId,
      observation: "FULFILLMENT_ERROR",
      entityAfter: { error: fulfillmentError, orderNumber: order.orderNumber },
    }).catch(() => undefined);
  }

  const partnerLeft = order.items.some(
    (item) =>
      !isEccopetSelfFulfilledItem({
        sku: item.sku,
        itemType: item.itemType,
        partnerId: item.partnerId ?? order.partnerId,
      })
  );
  const digital = platformItems.some((item) => isDigitalEccopetItemType(item.itemType) || Boolean(item.sku));
  if (!partnerLeft && digital && order.fulfillmentStatus !== OrderStatus.COMPLETED) {
    await prisma.order
      .update({
        where: { id: orderId },
        data: {
          fulfillmentStatus: OrderStatus.COMPLETED,
          statusHistory: {
            create: {
              status: OrderStatus.PAID,
              note: "SELF_FULFILLED",
            },
          },
        },
      })
      .catch(() => undefined);
  }

  return { ok: true as const, created, fulfillmentError };
}

export async function reconcilePaidPlatformOrders(params?: {
  userId?: string;
  orderNumber?: number;
  sku?: string;
  limit?: number;
}) {
  const orders = await prisma.order.findMany({
    where: {
      status: { in: [OrderStatus.PAID, OrderStatus.PARTIALLY_REFUNDED] },
      ...(params?.userId ? { userId: params.userId } : {}),
      ...(params?.orderNumber ? { orderNumber: params.orderNumber } : {}),
      ...(params?.sku ? { items: { some: { sku: params.sku } } } : {}),
    },
    select: {
      id: true,
      orderNumber: true,
      partnerId: true,
      items: { select: { sku: true, itemType: true, partnerId: true } },
      payments: { where: { status: "APPROVED" }, select: { id: true }, take: 1 },
    },
    take: params?.limit ?? 40,
    orderBy: { updatedAt: "asc" },
  });

  let scanned = 0;
  let fulfilled = 0;
  for (const order of orders) {
    const platform = order.items.some((item) =>
      isEccopetSelfFulfilledItem({
        sku: item.sku,
        itemType: item.itemType,
        partnerId: item.partnerId,
      })
    );
    if (!platform) continue;
    scanned += 1;
    const result = await fulfillApprovedOrder(order.id, order.payments[0]?.id ?? null);
    if (result.created > 0) fulfilled += 1;
  }
  return { scanned, fulfilled };
}

export async function reconcileKnownPaidEccopetOrders() {
  const known = await reconcilePaidPlatformOrders({ orderNumber: 6933611, limit: 1 });
  const rest = await reconcilePaidPlatformOrders({ limit: 50 });
  return {
    scanned: known.scanned + rest.scanned,
    fulfilled: known.fulfilled + rest.fulfilled,
  };
}
