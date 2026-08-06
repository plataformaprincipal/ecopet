import { prisma } from "@/lib/prisma";
import {
  AccountStatus,
  OrderStatus,
  DeliveryMethod,
  PaymentMethod,
  Prisma,
  ProductCatalogStatus,
  VerificationStatus,
} from "@prisma/client";
import { createInternalNotification } from "@/lib/notifications/internal";
import { emailOrderEvent } from "@/lib/mail/event-dispatch";
import { getUserEmailLocale } from "@/lib/email/templates";
import { getOrCreateCart } from "@/lib/cart/cart-service";
import { calculateOrderPricing, loadPricingSettings } from "@/lib/commerce/pricing";
import { writeAuditLog } from "@/lib/audit-log";

const PAYMENT_AT_DELIVERY_LABEL: Record<PaymentMethod, string> = {
  PIX: "PIX na entrega",
  CARD: "Cartão na entrega",
  CASH: "Dinheiro na entrega",
  TRANSFER: "Transferência",
  WALLET: "Carteira",
  BOLETO: "Boleto",
};

export async function checkoutFromCart(params: {
  userId: string;
  deliveryMethod: DeliveryMethod;
  paymentMethod?: PaymentMethod;
  phone: string;
  notes?: string | null;
  address: Prisma.InputJsonValue;
  idempotencyKey?: string | null;
}) {
  if (params.idempotencyKey) {
    const existing = await prisma.order.findUnique({
      where: { idempotencyKey: params.idempotencyKey },
      include: { items: true, payments: true },
    });
    if (existing) {
      if (existing.userId !== params.userId) throw new Error("IDEMPOTENCY_CONFLICT");
      return existing;
    }
  }

  const cart = await getOrCreateCart(params.userId);
  if (!cart.items.length) throw new Error("CART_EMPTY");

  const pricingSettings = await loadPricingSettings();
  const paymentMethod = params.paymentMethod ?? PaymentMethod.PIX;
  const paymentNote = PAYMENT_AT_DELIVERY_LABEL[paymentMethod] ?? paymentMethod;

  const order = await prisma.$transaction(async (tx) => {
    // Recarrega produtos do servidor — nunca confia em preço do cliente
    const productIds = cart.items.map((i) => i.productId);
    const products = await tx.product.findMany({
      where: { id: { in: productIds }, deletedAt: null },
      include: {
        seller: {
          select: {
            id: true,
            accountStatus: true,
            role: true,
            partnerProfile: { select: { verificationStatus: true, approvedAt: true } },
          },
        },
      },
    });
    const byId = new Map(products.map((p) => [p.id, p]));

    const lines: {
      productId: string;
      name: string;
      quantity: number;
      unitPrice: number;
      partnerId: string;
    }[] = [];

    for (const item of cart.items) {
      const product = byId.get(item.productId);
      if (!product) throw new Error("PRODUCT_NOT_FOUND");
      if (product.status !== ProductCatalogStatus.ACTIVE) throw new Error("PRODUCT_INACTIVE");
      if (product.approvalStatus !== "APPROVED") throw new Error("PRODUCT_NOT_APPROVED");
      if (product.price < 0) throw new Error("INVALID_UNIT_PRICE");
      if (item.quantity <= 0) throw new Error("INVALID_QUANTITY");
      if (product.stock < item.quantity) throw new Error("INSUFFICIENT_STOCK");

      const seller = product.seller;
      if (
        seller.role !== "PARTNER" ||
        seller.accountStatus !== AccountStatus.ACTIVE ||
        seller.partnerProfile?.verificationStatus !== VerificationStatus.APPROVED ||
        !seller.partnerProfile.approvedAt
      ) {
        throw new Error("PARTNER_NOT_APPROVED");
      }

      lines.push({
        productId: product.id,
        name: product.name,
        quantity: item.quantity,
        unitPrice: product.price,
        partnerId: product.sellerId,
      });
    }

    const partnerIds = new Set(lines.map((l) => l.partnerId));
    if (partnerIds.size !== 1) throw new Error("MULTI_PARTNER_CART");
    const partnerId = [...partnerIds][0]!;

    const priced = calculateOrderPricing(
      lines.map((l) => ({ unitPrice: l.unitPrice, quantity: l.quantity })),
      pricingSettings
    );
    if (priced.grossAmount <= 0) throw new Error("INVALID_TOTAL");

    for (const line of lines) {
      const updated = await tx.product.updateMany({
        where: { id: line.productId, stock: { gte: line.quantity }, deletedAt: null },
        data: { stock: { decrement: line.quantity } },
      });
      if (updated.count !== 1) throw new Error("INSUFFICIENT_STOCK");

      const product = await tx.product.findUnique({ where: { id: line.productId } });
      if (product) {
        await tx.inventoryLog.create({
          data: {
            productId: product.id,
            partnerId: product.sellerId,
            delta: -line.quantity,
            stockAfter: product.stock,
            reason: "ORDER_CHECKOUT",
            actorId: params.userId,
          },
        });
      }
    }

    const maxNum =
      (await tx.order.aggregate({ _max: { orderNumber: true } }))._max.orderNumber ?? 1000;

    const created = await tx.order.create({
      data: {
        orderNumber: maxNum + 1,
        userId: params.userId,
        partnerId,
        status: OrderStatus.PENDING_CONFIRMATION,
        fulfillmentStatus: OrderStatus.PENDING_CONFIRMATION,
        total: priced.grossAmount,
        grossAmount: priced.grossAmount,
        platformFeeAmount: priced.platformFeeAmount,
        partnerAmount: priced.partnerAmount,
        pricingVersion: priced.pricingVersion,
        currency: "BRL",
        idempotencyKey: params.idempotencyKey || null,
        shippingAddress: { ...(params.address as Record<string, unknown>), phone: params.phone },
        deliveryMethod: params.deliveryMethod,
        paymentMethod,
        deliveryNotes: params.notes ?? null,
        items: {
          create: lines.map((line, idx) => ({
            productId: line.productId,
            itemType: "product",
            name: line.name,
            quantity: line.quantity,
            price: priced.lines[idx]!.unitPrice,
            grossAmount: priced.lines[idx]!.grossAmount,
            platformFeeAmount: priced.lines[idx]!.platformFeeAmount,
            partnerAmount: priced.lines[idx]!.partnerAmount,
            pricingVersion: priced.pricingVersion,
            partnerId,
          })),
        },
        statusHistory: {
          create: {
            status: OrderStatus.PENDING_CONFIRMATION,
            note: `Pedido criado — pagamento: ${paymentNote} | pricing=${priced.pricingVersion}`,
          },
        },
        payments: {
          create: {
            provider: "pending",
            environment: process.env.MERCADO_PAGO_ENVIRONMENT === "production" ? "production" : "test",
            amount: priced.grossAmount,
            currency: "BRL",
            status: "PENDING",
            paymentMethod: paymentMethod,
            userId: params.userId,
            partnerId,
            metadata: {
              source: "checkout",
              pricingVersion: priced.pricingVersion,
              platformFeeAmount: priced.platformFeeAmount,
              partnerAmount: priced.partnerAmount,
              splitReady: false,
            },
          },
        },
      },
      include: { items: true, payments: true },
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
      actionUrl: `/client/orders`,
      data: { orderId: order.id },
    }),
    createInternalNotification({
      userId: order.partnerId!,
      title: "Novo pedido",
      body: `Você recebeu o pedido #${order.orderNumber}.`,
      type: "ORDER_RECEIVED",
      actionUrl: `/partner/orders`,
      data: { orderId: order.id },
    }),
    writeAuditLog({
      actorId: params.userId,
      action: "CREATE",
      module: "commerce.checkout",
      resource: "Order",
      resourceId: order.id,
      entityAfter: {
        orderNumber: order.orderNumber,
        status: order.status,
        total: order.total,
        pricingVersion: order.pricingVersion,
        platformFeeAmount: order.platformFeeAmount,
        partnerAmount: order.partnerAmount,
      },
    }).catch(() => undefined),
  ]);

  const user = await prisma.user.findUnique({
    where: { id: params.userId },
    select: { email: true, name: true, preferences: true },
  });
  if (user?.email) {
    void emailOrderEvent("ORDER_CREATED", user.email, order.orderNumber, {
      name: user.name,
      locale: getUserEmailLocale(user.preferences),
    });
  }

  return order;
}
