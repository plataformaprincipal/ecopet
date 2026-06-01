import { prisma } from "@ecopet/database";
import type { DeliveryMethod, OrderStatus, PaymentMethod, ServiceFulfillmentMode } from "@prisma/client";
import { asInputJson, asOptionalInputJson } from "../lib/prisma-json.js";
import { createAuditLog } from "./audit-service.js";
import { calculateShipping, generatePickupQrCode, resolvePartnerId } from "./logistics-service.js";
import { debitWallet, debitWalletTx, processRefund } from "./wallet-service.js";

interface CheckoutItem {
  productId?: string;
  serviceId?: string;
  quoteId?: string;
  itemType?: string;
  name: string;
  quantity: number;
  price: number;
  partnerId?: string;
}

interface CheckoutPayload {
  userId: string;
  items: CheckoutItem[];
  shippingAddress: Record<string, unknown>;
  alternateAddress?: Record<string, unknown>;
  deliveryMethod: DeliveryMethod;
  paymentMethod: PaymentMethod;
  scheduledAt?: string;
  deliveryNotes?: string;
  thirdPartyPickup?: { name: string; document: string };
  serviceMode?: ServiceFulfillmentMode;
  onlineLink?: string;
  partnerId?: string;
  discount?: number;
  couponCode?: string;
}

async function nextOrderNumber() {
  const last = await prisma.order.findFirst({ orderBy: { orderNumber: "desc" }, select: { orderNumber: true } });
  return (last?.orderNumber ?? 1000) + 1;
}

const PICKUP_METHODS: DeliveryMethod[] = ["PICKUP_LOCAL", "PICKUP_SCHEDULED"];

export async function createOrder(payload: CheckoutPayload) {
  const rawPartnerId = payload.partnerId ?? payload.items[0]?.partnerId;
  if (!rawPartnerId) throw new Error("Parceiro não identificado no pedido");
  const partnerId = await resolvePartnerId(rawPartnerId);

  const shipping = await calculateShipping(partnerId, payload.deliveryMethod);
  const subtotal = payload.items.reduce((s, i) => s + i.price * i.quantity, 0);
  const discount = payload.discount ?? 0;
  const total = Math.max(0, subtotal + shipping.fee - discount);
  const orderNumber = await nextOrderNumber();

  const isPickup = PICKUP_METHODS.includes(payload.deliveryMethod);
  const pickupQrCode = isPickup ? generatePickupQrCode("pending", orderNumber) : null;

  const order = await prisma.$transaction(async (tx) => {
    const created = await tx.order.create({
      data: {
        orderNumber,
        userId: payload.userId,
        partnerId,
        total,
        shippingCost: shipping.fee,
        discount,
        shippingAddress: asInputJson(payload.shippingAddress),
        alternateAddress: asOptionalInputJson(payload.alternateAddress ?? undefined),
        deliveryMethod: payload.deliveryMethod,
        paymentMethod: payload.paymentMethod,
        scheduledAt: payload.scheduledAt ? new Date(payload.scheduledAt) : undefined,
        deliveryNotes: payload.deliveryNotes,
        pickupInstructions: isPickup ? shipping.pickup.instructions : undefined,
        pickupQrCode,
        thirdPartyPickup: payload.thirdPartyPickup ?? undefined,
        serviceMode: payload.serviceMode,
        onlineLink: payload.onlineLink,
        carrierName: shipping.carrier ?? undefined,
        estimatedDelivery: shipping.estimatedDelivery,
        status: "PENDING",
        items: {
          create: payload.items.map((item) => ({
            productId: item.productId,
            serviceId: item.serviceId,
            quoteId: item.quoteId,
            itemType: item.itemType ?? "product",
            name: item.name,
            quantity: item.quantity,
            price: item.price,
            partnerId: item.partnerId ?? partnerId,
          })),
        },
        fulfillments: {
          create: [{
            partnerId,
            deliveryMethod: payload.deliveryMethod,
            carrierName: shipping.carrier ?? undefined,
            estimatedAt: shipping.estimatedDelivery,
          }],
        },
        statusHistory: {
          create: [{ status: "PENDING", note: "Pedido criado" }],
        },
      },
      include: { items: true, fulfillments: true, statusHistory: true },
    });

    if (payload.paymentMethod === "WALLET") {
      const { transaction } = await debitWalletTx(tx, {
        userId: payload.userId,
        amount: total,
        orderId: created.id,
        description: `Pedido #${orderNumber}`,
      });
      await tx.order.update({
        where: { id: created.id },
        data: { status: "PAID", walletTransactionId: transaction.id },
      });
      await tx.orderStatusHistory.create({
        data: { orderId: created.id, status: "PAID", note: "Pago com Saldo ECOPET" },
      });
    } else if (payload.paymentMethod !== "BOLETO") {
      await tx.order.update({
        where: { id: created.id },
        data: { status: "PAID", stripePaymentId: `sim_${Date.now()}` },
      });
      await tx.orderStatusHistory.create({
        data: { orderId: created.id, status: "PAID", note: `Pago via ${payload.paymentMethod}` },
      });
    }

    if (isPickup && pickupQrCode) {
      const qr = generatePickupQrCode(created.id, orderNumber);
      await tx.order.update({ where: { id: created.id }, data: { pickupQrCode: qr } });
    }

    return tx.order.findUniqueOrThrow({
      where: { id: created.id },
      include: { items: true, fulfillments: true, statusHistory: true },
    });
  });

  await createAuditLog({
    userId: payload.userId,
    action: "CREATE",
    module: "orders",
    resource: "order",
    resourceId: order.id,
    metadata: { orderNumber, total, deliveryMethod: payload.deliveryMethod },
  });

  await prisma.systemMetric.create({
    data: { metricKey: "orders.created", value: total, metadata: { orderId: order.id } },
  });

  const cashbackAmount = total * 0.02;
  if (cashbackAmount >= 0.01) {
    await prisma.cashback.create({
      data: {
        userId: payload.userId,
        orderId: order.id,
        amount: cashbackAmount,
        percentage: 2,
        description: "Cashback ECOPET 2%",
      },
    });
  }

  return order;
}

export async function listUserOrders(userId: string) {
  return prisma.order.findMany({
    where: { userId },
    include: {
      items: true,
      statusHistory: { orderBy: { createdAt: "asc" } },
      fulfillments: true,
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getOrderById(orderId: string, userId?: string) {
  const order = await prisma.order.findFirst({
    where: { id: orderId, ...(userId ? { userId } : {}) },
    include: {
      items: true,
      statusHistory: { orderBy: { createdAt: "asc" } },
      fulfillments: true,
      refunds: true,
    },
  });
  if (!order) throw new Error("Pedido não encontrado");
  return order;
}

export async function updateOrderStatus(orderId: string, status: OrderStatus, note?: string, actorId?: string) {
  const order = await prisma.order.update({
    where: { id: orderId },
    data: {
      status,
      fulfillmentStatus: status,
      statusHistory: { create: { status, note } },
      ...(status === "SHIPPED" ? { trackingCode: `ECO${Date.now().toString().slice(-10)}` } : {}),
    },
    include: { statusHistory: true },
  });

  await createAuditLog({
    userId: actorId,
    action: "UPDATE",
    module: "orders",
    resource: "order",
    resourceId: orderId,
    metadata: { status, note },
  });

  return order;
}

export async function confirmPickup(orderId: string, userId: string, qrCode?: string) {
  const order = await getOrderById(orderId, userId);
  if (!PICKUP_METHODS.includes(order.deliveryMethod)) {
    throw new Error("Este pedido não é retirada no local");
  }
  if (qrCode && order.pickupQrCode !== qrCode) {
    throw new Error("QR Code inválido");
  }
  return updateOrderStatus(orderId, "PICKED_UP", "Retirada confirmada", userId);
}

export async function requestOrderRefund(orderId: string, userId: string, reason?: string) {
  const order = await getOrderById(orderId, userId);
  if (order.status === "REFUNDED" || order.status === "CANCELLED") {
    throw new Error("Pedido já cancelado ou reembolsado");
  }
  const refund = await processRefund({
    userId,
    orderId,
    amount: order.total,
    originalMethod: order.paymentMethod,
    reason,
  });
  await updateOrderStatus(orderId, "REFUNDED", reason ?? "Reembolso solicitado", userId);
  return refund;
}
