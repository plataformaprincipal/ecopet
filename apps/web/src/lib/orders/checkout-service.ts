import { prisma } from "@/lib/prisma";
import {
  AccountStatus,
  OrderStatus,
  DeliveryMethod,
  PaymentMethod,
  Prisma,
  ProductCatalogStatus,
  QuoteStatus,
  VerificationStatus,
} from "@prisma/client";
import { createInternalNotification } from "@/lib/notifications/internal";
import { emailOrderEvent } from "@/lib/mail/event-dispatch";
import { getUserEmailLocale } from "@/lib/email/templates";
import { getOrCreateCart, QUOTE_CART_ITEM_TYPE } from "@/lib/cart/cart-service";
import { writeAuditLog } from "@/lib/audit-log";
import { assertCheckoutEnabled } from "@/lib/commerce/checkout-flags";
import { consumeCouponInCheckout, quoteCouponInTx } from "@/lib/commerce/apply-coupon";
import { PricingError, serverQuoteProduct, quoteToOrderFloats, couponToEngineInput } from "@/lib/pricing/service";
import { linesAfterDiscount } from "@/lib/commerce-chat/quotes-math";
import { isMercadoPagoCheckoutAvailable } from "@/lib/mercado-pago/config";
import { resolveOrderMarketplaceSplit } from "@/lib/mercado-pago/marketplace-split";
import { isSellerSellable, listSellablePartnerIdSet } from "@/lib/seller/eligibility";
import { isOngFeeExemptCategory } from "@/lib/ong/onboarding";
import { CHECKOUT_DB_TX, withCheckoutCreateRetry } from "@/lib/orders/order-number";

const ONLINE_PAYMENT_LABEL: Record<PaymentMethod, string> = {
  PIX: "Pix online (Mercado Pago)",
  CARD: "Cartão online (Mercado Pago)",
  CASH: "Dinheiro",
  TRANSFER: "Transferência",
  WALLET: "Carteira",
  BOLETO: "Boleto online (Mercado Pago)",
};

const COD_METHODS = new Set<PaymentMethod>([PaymentMethod.CASH, PaymentMethod.TRANSFER, PaymentMethod.WALLET]);

export async function checkoutFromCart(params: {
  userId: string;
  deliveryMethod: DeliveryMethod;
  paymentMethod?: PaymentMethod;
  phone: string;
  notes?: string | null;
  address: Prisma.InputJsonValue;
  idempotencyKey?: string | null;
  couponCode?: string | null;
  itemIds?: string[];
  checkoutSession?: {
    id: string;
    groupIndex: number;
    groupCount: number;
    sellerId: string;
    sellerName: string;
    kind: string;
  };
}) {
  assertCheckoutEnabled();

  if (!isMercadoPagoCheckoutAvailable()) {
    throw new Error("MP_NOT_CONFIGURED");
  }
  if (params.paymentMethod && COD_METHODS.has(params.paymentMethod)) {
    throw new Error("COD_NOT_ALLOWED");
  }

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
  const scoped = params.itemIds?.length
    ? cart.items.filter((i) => params.itemIds!.includes(i.id))
    : cart.items;
  const quoteCartItems = scoped.filter((i) => i.itemType === QUOTE_CART_ITEM_TYPE);
  if (quoteCartItems.length && scoped.every((i) => i.itemType === QUOTE_CART_ITEM_TYPE)) {
    return checkoutQuoteFromCart({ ...params, cart, quoteCartItems });
  }
  const physicalItems = scoped.filter((i) => i.itemType !== "DIGITAL_AI" && i.itemType !== "CATALOG_SKU" && i.productId);
  if (!physicalItems.length) throw new Error("CART_EMPTY");

  const paymentMethod = params.paymentMethod ?? PaymentMethod.CARD;
  const paymentNote = ONLINE_PAYMENT_LABEL[paymentMethod] ?? paymentMethod;

  const productIds = physicalItems.map((i) => i.productId!).filter(Boolean);
  const [products, sellable] = await Promise.all([
    prisma.product.findMany({
      where: { id: { in: productIds }, deletedAt: null },
      include: {
        seller: {
          select: {
            id: true,
            accountStatus: true,
            role: true,
            partnerProfile: { select: { verificationStatus: true, approvedAt: true } },
            ongProfile: { select: { verificationStatus: true, approvedAt: true } },
          },
        },
      },
    }),
    listSellablePartnerIdSet(),
  ]);
  const byId = new Map(products.map((p) => [p.id, p]));

  const lines: {
    productId: string;
    name: string;
    quantity: number;
    unitPrice: number;
    partnerId: string;
  }[] = [];

  for (const item of physicalItems) {
    if (!item.productId) continue;
    const product = byId.get(item.productId);
    if (!product) throw new Error("PRODUCT_NOT_FOUND");
    if (product.status !== ProductCatalogStatus.ACTIVE) throw new Error("PRODUCT_INACTIVE");
    if (product.approvalStatus !== "APPROVED") throw new Error("PRODUCT_NOT_APPROVED");
    if (product.price < 0) throw new Error("INVALID_UNIT_PRICE");
    if (item.quantity <= 0) throw new Error("INVALID_QUANTITY");
    if (product.stock < item.quantity) throw new Error("INSUFFICIENT_STOCK");

    const seller = product.seller;
    const partnerApproved =
      seller.role === "PARTNER" &&
      seller.accountStatus === AccountStatus.ACTIVE &&
      seller.partnerProfile?.verificationStatus === VerificationStatus.APPROVED &&
      Boolean(seller.partnerProfile.approvedAt);
    const ongApproved =
      seller.role === "ONG" &&
      seller.accountStatus === AccountStatus.ACTIVE &&
      seller.ongProfile?.verificationStatus === VerificationStatus.APPROVED &&
      Boolean(seller.ongProfile.approvedAt);
    if (!partnerApproved && !ongApproved) {
      throw new Error("PARTNER_NOT_APPROVED");
    }
    if (!sellable.has(product.sellerId)) {
      throw new Error("SELLER_NOT_ENABLED");
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
  if (couponCode) {
    const quoted = await quoteCouponInTx(prisma, {
      userId: params.userId,
      code: couponCode,
      grossBrl: lines.reduce((s, l) => s + l.unitPrice * l.quantity, 0),
    });
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
      feeExempt: lines.every((l) => {
        const product = byId.get(l.productId);
        return (
          product?.seller.role === "ONG" &&
          isOngFeeExemptCategory(`${product.catalogCategory ?? ""} ${product.name} ${product.pricingCatalogSku ?? ""}`)
        );
      }),
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

  const amount = Math.max(0, snap.grossAmount - snap.discountAmount);
  const splitEval = await resolveOrderMarketplaceSplit({
    partnerId,
    itemPartnerIds: [partnerId],
    amount,
    applicationFeeAmount: snap.platformFeeAmount,
  });
  if (!splitEval.capability.splitReady) {
    throw new Error("SELLER_SPLIT_UNAVAILABLE");
  }

  const order = await withCheckoutCreateRetry((orderNumber) =>
    prisma.$transaction(async (tx) => {
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

    const created = await tx.order.create({
      data: {
        orderNumber,
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
        pricingSnapshot: {
          ...(engineSnapshot as Record<string, unknown>),
          ...(params.checkoutSession ? { checkoutSession: params.checkoutSession } : {}),
        } as Prisma.InputJsonValue,
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
              splitReady: true,
              logicalSplitOnly: false,
              estimatesOnly: false,
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

    await tx.cartItem.deleteMany({
      where: params.itemIds?.length
        ? { cartId: cart.id, id: { in: params.itemIds } }
        : { cartId: cart.id, itemType: { not: "DIGITAL_AI" } },
    });
    return created;
  }, CHECKOUT_DB_TX),
  );

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

async function checkoutQuoteFromCart(params: {
  userId: string;
  deliveryMethod: DeliveryMethod;
  paymentMethod?: PaymentMethod;
  phone: string;
  notes?: string | null;
  address: Prisma.InputJsonValue;
  idempotencyKey?: string | null;
  couponCode?: string | null;
  itemIds?: string[];
  checkoutSession?: {
    id: string;
    groupIndex: number;
    groupCount: number;
    sellerId: string;
    sellerName: string;
    kind: string;
  };
  cart: Awaited<ReturnType<typeof getOrCreateCart>>;
  quoteCartItems: Awaited<ReturnType<typeof getOrCreateCart>>["items"];
}) {
  const quoteIds = [
    ...new Set(
      params.quoteCartItems.map((item) => {
        const meta = (item.metadata as Record<string, unknown> | null) ?? {};
        return typeof meta.quoteId === "string" ? meta.quoteId : item.lineKey.replace(/^quote:/, "");
      })
    ),
  ];
  const quotes = await prisma.customQuote.findMany({
    where: { id: { in: quoteIds } },
  });
  if (quotes.length !== quoteIds.length) throw new Error("QUOTE_NOT_FOUND");

  const now = Date.now();
  for (const quote of quotes) {
    if (quote.requesterId !== params.userId) throw new Error("QUOTE_FORBIDDEN");
    if (quote.status !== QuoteStatus.ACCEPTED) throw new Error("QUOTE_NOT_ACCEPTED");
    if (quote.validUntil.getTime() <= now) throw new Error("QUOTE_EXPIRED");
  }

  const partnerIds = new Set(quotes.map((q) => q.providerId));
  if (partnerIds.size !== 1) throw new Error("MULTI_PARTNER_CART");
  const partnerId = [...partnerIds][0]!;
  if (!(await isSellerSellable(partnerId))) {
    throw new Error("SELLER_NOT_ENABLED");
  }

  const paymentMethod = params.paymentMethod ?? PaymentMethod.CARD;
  const paymentNote = ONLINE_PAYMENT_LABEL[paymentMethod] ?? paymentMethod;

  const { serverQuoteProduct, quoteToOrderFloats, PricingError } = await import("@/lib/pricing/service");
  const { markQuoteConverted, asPayload } = await import("@/lib/commerce-chat/quotes");
  const { COMMERCIAL_EVENT, postCommercialEvent } = await import("@/lib/commerce-chat/events");

  const quote = quotes[0]!;
  const payload = asPayload(quote.includedItems);
  let snap: ReturnType<typeof quoteToOrderFloats>;
  let engineSnapshot: Record<string, unknown>;
  try {
    const discounted = linesAfterDiscount(payload.items, payload.discountAmount);
    const quoted = await serverQuoteProduct({
      lines: discounted.map((line) => ({
        unitPrice: line.unitPrice,
        quantity: line.quantity,
        sku: line.sku ?? null,
      })),
      partnerVerified: true,
      partnerId,
      charging: true,
    });
    snap = quoteToOrderFloats(quoted.order);
    engineSnapshot = quoted.order.snapshot as Record<string, unknown>;
  } catch (e) {
    if (e instanceof PricingError) throw e;
    throw new PricingError("PRICING_UNAVAILABLE", "Motor de pricing indisponível. Checkout bloqueado (fail-closed).");
  }

  const total = Math.max(0, snap.total + payload.shippingAmount);
  if (!(total > 0)) throw new Error("INVALID_TOTAL");

  const quoteSplit = await resolveOrderMarketplaceSplit({
    partnerId,
    itemPartnerIds: [partnerId],
    amount: total,
    applicationFeeAmount: snap.platformFeeAmount,
  });
  if (!quoteSplit.capability.splitReady) {
    throw new Error("SELLER_SPLIT_UNAVAILABLE");
  }

  const order = await withCheckoutCreateRetry((orderNumber) =>
    prisma.$transaction(async (tx) => {
    const created = await tx.order.create({
      data: {
        orderNumber,
        userId: params.userId,
        partnerId,
        status: OrderStatus.PENDING_CONFIRMATION,
        fulfillmentStatus: OrderStatus.PENDING_CONFIRMATION,
        total,
        shippingCost: payload.shippingAmount,
        discount: payload.discountAmount,
        grossAmount: snap.grossAmount,
        platformFeeAmount: snap.platformFeeAmount,
        partnerAmount: snap.partnerAmount,
        platformPercentage: snap.platformPercentage,
        platformFixedFee: snap.platformFixedFee,
        gatewayFeeEstimated: snap.gatewayFeeEstimated,
        reserveAmount: snap.reserveAmount,
        taxEstimate: snap.taxEstimate,
        pricingVersion: snap.pricingVersion,
        pricingSnapshot: {
          ...(engineSnapshot as Record<string, unknown>),
          ...(params.checkoutSession ? { checkoutSession: params.checkoutSession } : {}),
        } as Prisma.InputJsonValue,
        currency: "BRL",
        idempotencyKey: params.idempotencyKey || null,
        shippingAddress: { ...(params.address as Record<string, unknown>), phone: params.phone },
        deliveryMethod: params.deliveryMethod,
        paymentMethod,
        deliveryNotes: params.notes ?? null,
        items: {
          create: payload.items.map((line) => ({
            quoteId: quote.id,
            itemType: QUOTE_CART_ITEM_TYPE,
            name: line.description,
            quantity: line.quantity,
            price: line.unitPrice,
            grossAmount: line.unitPrice * line.quantity,
            platformFeeAmount: 0,
            partnerAmount: line.unitPrice * line.quantity,
            pricingVersion: snap.pricingVersion,
            partnerId,
            sku: line.sku,
            petId: payload.petId,
            productId: line.productId,
            serviceId: line.serviceId,
          })),
        },
        statusHistory: {
          create: {
            status: OrderStatus.PENDING_CONFIRMATION,
            note: `Pedido de orçamento — pagamento: ${paymentNote} | pricing=${snap.pricingVersion}`,
          },
        },
        payments: {
          create: {
            provider: "pending",
            environment: process.env.MERCADO_PAGO_ENVIRONMENT === "production" ? "production" : "test",
            amount: total,
            currency: "BRL",
            status: "PENDING",
            paymentMethod: paymentMethod,
            userId: params.userId,
            partnerId,
            metadata: {
              source: "quote-checkout",
              quoteId: quote.id,
              pricingVersion: snap.pricingVersion,
              splitReady: true,
              logicalSplitOnly: false,
              estimatesOnly: false,
            },
          },
        },
      },
      include: { items: true, payments: true },
    });

    await tx.cartItem.deleteMany({
      where: params.itemIds?.length
        ? { cartId: params.cart.id, id: { in: params.itemIds } }
        : { cartId: params.cart.id, itemType: QUOTE_CART_ITEM_TYPE },
    });
    return created;
  }, CHECKOUT_DB_TX),
  );

  for (const quote of quotes) {
    await markQuoteConverted(quote.id, order.id);
    if (quote.conversationId) {
      await postCommercialEvent({
        conversationId: quote.conversationId,
        senderId: params.userId,
        event: COMMERCIAL_EVENT.PAYMENT_PENDING,
        quoteId: quote.id,
        orderId: order.id,
      }).catch(() => undefined);
    }
  }

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
      userId: partnerId,
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
      entityAfter: { orderNumber: order.orderNumber, source: "quote", total: order.total },
    }).catch(() => undefined),
  ]);

  return order;
}
