import { prisma } from "@/lib/prisma";
import { OrderStatus, DeliveryMethod, Prisma } from "@prisma/client";
import { createInternalNotification } from "@/lib/notifications/internal";
import { emailOrderEvent } from "@/lib/mail/event-dispatch";
import { getOrCreateCart, serializeCart } from "@/lib/cart/cart-service";
import { createPaymentIntentSafe } from "@/lib/payments/gateway";

export async function checkoutFromCart(params: {
  userId: string;
  deliveryMethod: DeliveryMethod;
  phone: string;
  notes?: string | null;
  address: Prisma.InputJsonValue;
}) {
  const cart = await getOrCreateCart(params.userId);
  const serialized = serializeCart(cart);
  if (!serialized.items.length) throw new Error("CART_EMPTY");
  if (serialized.multiPartner) throw new Error("MULTI_PARTNER_CART");

  const partnerId = serialized.partnerId!;
  const orderNumber = (await prisma.order.aggregate({ _max: { orderNumber: true } }))._max.orderNumber ?? 1000;

  const order = await prisma.$transaction(async (tx) => {
    for (const item of serialized.items) {
      const updated = await tx.product.updateMany({
        where: { id: item.productId, stock: { gte: item.quantity }, deletedAt: null },
        data: { stock: { decrement: item.quantity } },
      });
      if (updated.count !== 1) throw new Error("INSUFFICIENT_STOCK");

      const product = await tx.product.findUnique({ where: { id: item.productId } });
      if (product) {
        await tx.inventoryLog.create({
          data: {
            productId: product.id,
            partnerId: product.sellerId,
            delta: -item.quantity,
            stockAfter: product.stock - item.quantity,
            reason: "ORDER_CHECKOUT",
            actorId: params.userId,
          },
        });
      }
    }

    const created = await tx.order.create({
      data: {
        orderNumber: orderNumber + 1,
        userId: params.userId,
        partnerId,
        status: OrderStatus.PENDING_CONFIRMATION,
        fulfillmentStatus: OrderStatus.PENDING_CONFIRMATION,
        total: serialized.subtotal,
        shippingAddress: params.address,
        deliveryMethod: params.deliveryMethod,
        deliveryNotes: params.notes ?? null,
        items: {
          create: serialized.items.map((item) => ({
            productId: item.productId,
            itemType: "product",
            name: item.name,
            quantity: item.quantity,
            price: item.unitPrice,
            partnerId,
          })),
        },
        statusHistory: {
          create: { status: OrderStatus.PENDING_CONFIRMATION, note: "Pedido criado" },
        },
      },
      include: { items: true },
    });

    await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
    return created;
  });

  await Promise.all([
    createInternalNotification({
      userId: params.userId,
      title: "Pedido criado",
      body: `Seu pedido #${order.orderNumber} foi registrado.`,
      type: "ORDER_CREATED",
      data: { orderId: order.id },
    }),
    createInternalNotification({
      userId: partnerId,
      title: "Novo pedido",
      body: `Você recebeu o pedido #${order.orderNumber}.`,
      type: "ORDER_RECEIVED",
      data: { orderId: order.id },
    }),
  ]);

  const user = await prisma.user.findUnique({ where: { id: params.userId }, select: { email: true, name: true } });
  if (user?.email) {
    void emailOrderEvent(
      "ORDER_CREATED",
      user.email,
      order.orderNumber,
      `Olá ${user.name}, seu pedido #${order.orderNumber} foi registrado.`
    );
  }

  const partner = await prisma.user.findUnique({ where: { id: partnerId }, select: { email: true, name: true } });
  if (partner?.email) {
    void emailOrderEvent(
      "ORDER_CREATED",
      partner.email,
      order.orderNumber,
      `Você recebeu o pedido #${order.orderNumber}.`
    );
  }

  // Etapa 9A — registra intenção apenas se gateway real configurado; nunca simula pagamento
  void createPaymentIntentSafe({
    orderId: order.id,
    orderNumber: order.orderNumber,
    amount: order.total,
    customerEmail: user?.email ?? "",
    customerName: user?.name ?? "",
  });

  return order;
}
