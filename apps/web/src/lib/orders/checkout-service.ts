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
import { writeAuditLog } from "@/lib/audit-log";
import { assertCheckoutEnabled } from "@/lib/commerce/checkout-flags";
import { consumeCouponInCheckout, quoteCouponInTx } from "@/lib/commerce/apply-coupon";
import { PricingError, serverQuoteProduct, quoteToOrderFloats, couponToEngineInput } from "@/lib/pricing/service";

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
  couponCode?: string | null;
}) {
  assertCheckoutEnabled();

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

    const couponCode = params.couponCode?.trim().toUpperCase() || null;
    let couponInput: ReturnType<typeof couponToEngineInput> | null = null;
    let discountAmount = 0;
    if (couponCode) {
      const quoted = await quoteCouponInTx(tx, {
        userId: params.userId,
        code: couponCode,
        grossBrl: lines.reduce((s, l) => s + l.unitPrice * l.quantity, 0),
      });
      discountAmount = quoted.discountAmount;
      couponInput = couponToEngineInput(quoted.coupon);
    }

    let snap: ReturnType<typeof quoteToOrderFloats>;
    let engineSnapshot: Record<string, unknown>;
    let lineQuotes: { platformFeeAmount: number; partnerAmount: number; grossAmount: number; unitPrice: number }[];
    try {
      const quoted = await serverQuoteProduct({
        lines: lines.map((l) => {
          const product = byId.get(l.productId);
          return {
            unitPrice: l.unitPrice,
            quantity: l.quantity,
            sku: product?.pricingCatalogSku ?? null,
          };
        }),
        coupon: couponInput,
        partnerVerified: true,
        partnerId,
        charging: true,
      });
      snap = quoteToOrderFloats(quoted.order);
      engineSnapshot = quoted.order.snapshot;
      lineQuotes = quoted.lines.map((line, idx) => ({
        unitPrice: lines[idx]!.unitPrice,
        grossAmount: line.baseAmountCents / 100,
        platformFeeAmount: (line.eccopetCommissionCents + line.fixedFeeCents) / 100,
        partnerAmount: line.estimatedPayoutCents / 100,
      }));
    } catch (e) {
      if (e instanceof PricingError) throw e;
      throw new PricingError(
        "PRICING_UNAVAILABLE",
        "Motor de pricing indisponível. Checkout bloqueado (fail-closed)."
      );
    }
    if (snap.grossAmount <= 0) throw new Error("INVALID_TOTAL");

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
        total: Math.max(0, snap.grossAmount - snap.discountAmount),
        grossAmount: snap.grossAmount,
        discount: snap.discountAmount,
        platformFeeAmount: snap.platformFeeAmount,
        partnerAmount: snap.partnerAmount,
        platformPercentage: snap.platformPercentage,
        platformFixedFee: snap.platformFixedFee,
        gatewayFeeEstimated: snap.gatewayFeeEstimated,
        reserveAmount: snap.reserveAmount,
        taxEstimate: snap.taxEstimate,
        pricingVersion: snap.pricingVersion,
        pricingSnapshot: engineSnapshot as Prisma.InputJsonValue,
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
            price: lineQuotes[idx]!.unitPrice,
            grossAmount: lineQuotes[idx]!.grossAmount,
            platformFeeAmount: lineQuotes[idx]!.platformFeeAmount,
            partnerAmount: lineQuotes[idx]!.partnerAmount,
            pricingVersion: snap.pricingVersion,
            partnerId,
          })),
        },
        statusHistory: {
          create: {
            status: OrderStatus.PENDING_CONFIRMATION,
            note: `Pedido criado — pagamento: ${paymentNote} | pricing=${snap.pricingVersion}`,
          },
        },
        payments: {
          create: {
            provider: "pending",
            environment: process.env.MERCADO_PAGO_ENVIRONMENT === "production" ? "production" : "test",
            amount: Math.max(0, snap.grossAmount - snap.discountAmount),
            currency: "BRL",
            status: "PENDING",
            paymentMethod: paymentMethod,
            userId: params.userId,
            partnerId,
            metadata: {
              source: "checkout",
              pricingVersion: snap.pricingVersion,
              platformFeeAmount: snap.platformFeeAmount,
              partnerAmount: snap.partnerAmount,
              gatewayFeeEstimated: snap.gatewayFeeEstimated,
              reserveAmount: snap.reserveAmount,
              taxEstimate: snap.taxEstimate,
              splitReady: false,
              logicalSplitOnly: true,
              estimatesOnly: true,
            },
          },
        },
      },
      include: { items: true, payments: true },
    });

    if (couponCode) {
      await consumeCouponInCheckout({
        tx,
        userId: params.userId,
        code: couponCode,
        grossBrl: snap.grossAmount,
        orderId: created.id,
      });
    }

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
