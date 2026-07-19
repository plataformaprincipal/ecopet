import { z } from "zod";
import { OrderStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiFailure } from "@/lib/api-response";
import { requireActivePartner } from "@/lib/auth/require-auth";
import { createInternalNotification } from "@/lib/notifications/internal";
import { emailOrderEvent } from "@/lib/mail/event-dispatch";
import { getUserEmailLocale } from "@/lib/email/templates";

const statusSchema = z.object({
  status: z.nativeEnum(OrderStatus),
  note: z.string().optional().nullable(),
});

const ALLOWED_TRANSITIONS: Partial<Record<OrderStatus, OrderStatus[]>> = {
  PENDING_CONFIRMATION: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
  CONFIRMED: [OrderStatus.PREPARING, OrderStatus.CANCELLED],
  PREPARING: [
    OrderStatus.READY_FOR_PICKUP,
    OrderStatus.READY_PICKUP,
    OrderStatus.SHIPPED,
    OrderStatus.OUT_FOR_DELIVERY,
    OrderStatus.CANCELLED,
  ],
  READY_FOR_PICKUP: [OrderStatus.PICKED_UP, OrderStatus.CANCELLED],
  READY_PICKUP: [OrderStatus.PICKED_UP, OrderStatus.CANCELLED],
  SHIPPED: [OrderStatus.OUT_FOR_DELIVERY, OrderStatus.DELIVERED],
  OUT_FOR_DELIVERY: [OrderStatus.DELIVERED],
  DELIVERED: [OrderStatus.COMPLETED],
  PICKED_UP: [OrderStatus.COMPLETED],
};

type RouteContext = { params: Promise<{ orderId: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const { user, error } = await requireActivePartner();
  if (error) return error;
  const { orderId } = await context.params;

  const parsed = statusSchema.safeParse(await request.json());
  if (!parsed.success) {
    return apiFailure("VALIDATION", parsed.error.errors[0]?.message ?? "Inválido", 400);
  }

  const order = await prisma.order.findFirst({
    where: { id: orderId, partnerId: user!.id },
  });
  if (!order) return apiFailure("NOT_FOUND", "Pedido não encontrado.", 404);

  const nextStatus = parsed.data.status;
  const shippingStatuses: OrderStatus[] = [
    OrderStatus.SHIPPED,
    OrderStatus.OUT_FOR_DELIVERY,
    OrderStatus.READY_FOR_PICKUP,
    OrderStatus.READY_PICKUP,
    OrderStatus.DELIVERED,
    OrderStatus.PICKED_UP,
  ];
  if (
    (order.fraudHold || order.fulfillmentBlocked) &&
    shippingStatuses.includes(nextStatus) &&
    nextStatus !== OrderStatus.CANCELLED
  ) {
    return apiFailure(
      "FORBIDDEN",
      "Expedição bloqueada por alerta de segurança/fraude. Contate o suporte EcoPet.",
      403
    );
  }

  const allowed = ALLOWED_TRANSITIONS[order.status] ?? [];
  if (!allowed.includes(nextStatus)) {
    return apiFailure(
      "VALIDATION",
      `Transição inválida de ${order.status} para ${nextStatus}.`,
      400
    );
  }

  const updated = await prisma.$transaction(async (tx) => {
    if (nextStatus === OrderStatus.CANCELLED) {
      const items = await tx.orderItem.findMany({ where: { orderId } });
      for (const item of items) {
        if (!item.productId) continue;
        const product = await tx.product.findUnique({ where: { id: item.productId } });
        if (!product) continue;

        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { increment: item.quantity } },
        });

        await tx.inventoryLog.create({
          data: {
            productId: item.productId,
            partnerId: product.sellerId,
            delta: item.quantity,
            stockAfter: product.stock + item.quantity,
            reason: "ORDER_CANCELLED",
            actorId: user!.id,
          },
        });
      }
    }

    return tx.order.update({
      where: { id: orderId },
      data: {
        status: nextStatus,
        fulfillmentStatus: nextStatus,
        statusHistory: {
          create: { status: nextStatus, note: parsed.data.note ?? `Status atualizado para ${nextStatus}` },
        },
      },
      include: { items: true, statusHistory: { orderBy: { createdAt: "asc" } } },
    });
  });

  await createInternalNotification({
    userId: order.userId,
    title: "Atualização de pedido",
    body: `Seu pedido #${order.orderNumber} está ${nextStatus}.`,
    type: "ORDER_STATUS_UPDATED",
    actionUrl: `/dashboard/client/orders/${orderId}`,
    data: { orderId, status: nextStatus },
  });

  const buyer = await prisma.user.findUnique({
    where: { id: order.userId },
    select: { email: true, name: true, preferences: true },
  });
  if (buyer?.email && ["CONFIRMED", "CANCELLED", "COMPLETED"].includes(nextStatus)) {
    const event =
      nextStatus === "CONFIRMED" ? "ORDER_CONFIRMED"
      : nextStatus === "CANCELLED" ? "ORDER_CANCELLED"
      : "ORDER_COMPLETED";
    void emailOrderEvent(event, buyer.email, order.orderNumber, {
      name: buyer.name,
      locale: getUserEmailLocale(buyer.preferences),
      message: `Seu pedido #${order.orderNumber} está ${nextStatus}.`,
      title: `Pedido #${order.orderNumber} — EcoPet`,
    });
  }

  return apiSuccess({ order: updated });
}

export async function PUT(request: Request, context: RouteContext) {
  return PATCH(request, context);
}
