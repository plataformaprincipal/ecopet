import { OrderStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiFailure } from "@/lib/api-response";
import { requireClient } from "@/lib/auth/require-auth";
import { createInternalNotification } from "@/lib/notifications/internal";

type RouteContext = { params: Promise<{ orderId: string }> };

export async function PATCH(_req: Request, context: RouteContext) {
  const { user, error } = await requireClient();
  if (error) return error;
  const { orderId } = await context.params;

  const order = await prisma.order.findFirst({
    where: { id: orderId, userId: user!.id },
    include: { items: true },
  });
  if (!order) return apiFailure("NOT_FOUND", "Pedido não encontrado.", 404);
  if (order.status !== OrderStatus.PENDING_CONFIRMATION) {
    return apiFailure("VALIDATION", "Só é possível cancelar pedidos aguardando confirmação.", 400);
  }

  const updated = await prisma.$transaction(async (tx) => {
    for (const item of order.items) {
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

    return tx.order.update({
      where: { id: orderId },
      data: {
        status: OrderStatus.CANCELLED,
        fulfillmentStatus: OrderStatus.CANCELLED,
        statusHistory: {
          create: { status: OrderStatus.CANCELLED, note: "Cancelado pelo cliente" },
        },
      },
      include: { items: true, statusHistory: { orderBy: { createdAt: "asc" } } },
    });
  });

  if (order.partnerId) {
    await createInternalNotification({
      userId: order.partnerId,
      title: "Pedido cancelado",
      body: `O pedido #${order.orderNumber} foi cancelado pelo cliente.`,
      type: "ORDER_CANCELLED",
      data: { orderId },
    });
  }

  return apiSuccess({ order: updated });
}
