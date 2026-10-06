import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";
import { getOrCreateCart, serializeCart } from "@/lib/cart/cart-service";
import { checkoutFromCart } from "@/lib/orders/checkout-service";
import { checkoutAiFromCart } from "@/lib/ai-commerce/checkout-service";
import { checkoutCatalogSku } from "@/lib/commerce-catalog/checkout";
import { MP_SPLIT_MODE, MULTI_SELLER_STRATEGY, type PaymentGroupDraft } from "@/lib/cart/universal";
import { moneyEquals } from "@/lib/orders/order-number";
import { OrderStatus } from "@prisma/client";
import type { DeliveryMethod, PaymentMethod, Prisma } from "@prisma/client";

export type CheckoutSessionGroup = {
  index: number;
  orderId: string;
  orderNumber: number;
  sellerId: string;
  sellerName: string;
  kind: PaymentGroupDraft["kind"];
  amount: number;
  status: string;
  paymentStatus: string;
  idempotencyKey: string;
};

export function groupIdempotencyKey(sessionId: string, index: number, sellerId: string, kind: string) {
  return `${sessionId}:g${index}:${sellerId}:${kind}`;
}

async function stampAndLoad(orderId: string) {
  return prisma.order.findUniqueOrThrow({
    where: { id: orderId },
    include: { items: true, payments: true, partner: { select: { id: true, name: true, partnerProfile: { select: { businessName: true } } } } },
  });
}

function assertGroupTotals(
  draft: PaymentGroupDraft,
  order: { total: number; discount: number | null; items: Array<{ price: number; quantity: number; grossAmount: number | null }> },
  couponOnThisGroup: boolean
) {
  const itemSum = order.items.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0);
  const orderTotal = Number(order.total);
  const discounted = Math.max(0, Math.round((itemSum - Number(order.discount ?? 0)) * 100) / 100);
  if (!moneyEquals(discounted, orderTotal) && !moneyEquals(itemSum, orderTotal)) {
    console.error("[checkout] CHECKOUT_TOTAL_MISMATCH items-vs-order", {
      itemSum,
      discounted,
      orderTotal,
      sellerId: draft.sellerId,
      kind: draft.kind,
    });
    throw new Error("CHECKOUT_TOTAL_MISMATCH");
  }
  if (!couponOnThisGroup && draft.kind !== "CATALOG" && draft.kind !== "SUBSCRIPTION") {
    if (!moneyEquals(draft.grossAmount, orderTotal)) {
      console.error("[checkout] CHECKOUT_TOTAL_MISMATCH group-vs-order", {
        groupAmount: draft.grossAmount,
        orderTotal,
        sellerId: draft.sellerId,
        kind: draft.kind,
      });
      throw new Error("CHECKOUT_TOTAL_MISMATCH");
    }
  }
}

export async function invalidateUnpaidCheckoutSession(userId: string, sessionId: string) {
  const orders = await prisma.order.findMany({
    where: { userId, idempotencyKey: { startsWith: `${sessionId}:` } },
    include: { payments: true },
  });
  const unpaid = orders.filter((order) => {
    const paid =
      order.status === OrderStatus.PAID ||
      order.payments.some((p) => p.status === "APPROVED");
    return !paid;
  });
  if (!unpaid.length) return { cancelled: 0 };
  await prisma.order.updateMany({
    where: { id: { in: unpaid.map((o) => o.id) } },
    data: { status: OrderStatus.CANCELLED, fulfillmentStatus: OrderStatus.CANCELLED },
  });
  return { cancelled: unpaid.length };
}

export async function checkoutUniversalFromCart(params: {
  userId: string;
  deliveryMethod: DeliveryMethod;
  paymentMethod?: PaymentMethod;
  phone: string;
  notes?: string | null;
  address: Prisma.InputJsonValue;
  idempotencyKey?: string | null;
  couponCode?: string | null;
  role?: string;
}) {
  const sessionId = params.idempotencyKey?.trim() || randomUUID();
  const existing = await prisma.order.findMany({
    where: { userId: params.userId, idempotencyKey: { startsWith: `${sessionId}:` } },
    include: { payments: true, items: true },
    orderBy: { createdAt: "asc" },
  });

  const cart = await getOrCreateCart(params.userId);
  const serialized = await serializeCart(cart);
  if (serialized.blockedCount > 0 && serialized.summary.payableCount === 0) {
    throw new Error("CART_HAS_BLOCKED_ITEMS");
  }
  if (serialized.blockedCount > 0) {
    throw new Error("CART_HAS_BLOCKED_ITEMS");
  }
  const drafts = serialized.paymentGroups;
  if (!drafts.length) throw new Error("CART_EMPTY");

  const groups: CheckoutSessionGroup[] = [];

  for (let index = 0; index < drafts.length; index += 1) {
    const draft = drafts[index]!;
    const key = groupIdempotencyKey(sessionId, index, draft.sellerId, draft.kind);
    const already = existing.find((o) => o.idempotencyKey === key);
    const sessionMeta = {
      id: sessionId,
      groupIndex: index,
      groupCount: drafts.length,
      sellerId: draft.sellerId,
      sellerName: draft.sellerName,
      kind: draft.kind,
      strategy: MULTI_SELLER_STRATEGY,
      splitMode: MP_SPLIT_MODE,
    };

    if (already) {
      groups.push({
        index,
        orderId: already.id,
        orderNumber: already.orderNumber,
        sellerId: draft.sellerId,
        sellerName: draft.sellerName,
        kind: draft.kind,
        amount: Number(already.total),
        status: already.status,
        paymentStatus: already.payments[0]?.status ?? "PENDING",
        idempotencyKey: key,
      });
      continue;
    }

    const common = {
      userId: params.userId,
      deliveryMethod: params.deliveryMethod,
      paymentMethod: params.paymentMethod,
      phone: params.phone,
      notes: params.notes,
      address: params.address,
      idempotencyKey: key,
      couponCode: index === 0 ? params.couponCode : null,
      itemIds: draft.itemIds,
      checkoutSession: sessionMeta,
    };

    let orderId = "";
    if (draft.kind === "AI") {
      const order = await checkoutAiFromCart({
        userId: params.userId,
        idempotencyKey: key,
        couponCode: index === 0 ? params.couponCode : null,
        itemIds: draft.itemIds,
        checkoutSession: sessionMeta,
      });
      orderId = order.id;
    } else if (draft.kind === "SUBSCRIPTION" || draft.kind === "CATALOG") {
      const line = serialized.items.find((i) => i.id === draft.itemIds[0]);
      if (!line?.sku) throw new Error("CART_EMPTY");
      const result = await checkoutCatalogSku({
        userId: params.userId,
        sku: line.sku,
        petId: line.petId,
        idempotencyKey: key,
        role: params.role,
        cartItemId: line.id,
        checkoutSession: sessionMeta,
      });
      orderId = result.order.id;
    } else {
      const order = await checkoutFromCart(common);
      orderId = order.id;
    }

    const loaded = await stampAndLoad(orderId);
    assertGroupTotals(draft, loaded, Boolean(params.couponCode) && index === 0);
    groups.push({
      index,
      orderId: loaded.id,
      orderNumber: loaded.orderNumber,
      sellerId: draft.sellerId,
      sellerName: draft.sellerName,
      kind: draft.kind,
      amount: Number(loaded.total),
      status: loaded.status,
      paymentStatus: loaded.payments[0]?.status ?? (loaded.status === "PAID" ? "APPROVED" : "PENDING"),
      idempotencyKey: key,
    });
  }

  const pending = groups.filter((g) => g.paymentStatus !== "APPROVED" && g.status !== "PAID");
  const approved = groups.filter((g) => g.paymentStatus === "APPROVED" || g.status === "PAID");
  const sessionStatus =
    approved.length === groups.length ? "PAID" : approved.length > 0 ? "PARTIALLY_PAID" : "PENDING";

  const primary = pending[0] ?? groups[0]!;
  const primaryOrder = await prisma.order.findUniqueOrThrow({
    where: { id: primary.orderId },
    include: { items: true, payments: true },
  });

  return {
    sessionId,
    splitMode: MP_SPLIT_MODE,
    strategy: MULTI_SELLER_STRATEGY,
    status: sessionStatus,
    notice:
      groups.length > 1
        ? "Seu pedido contém itens de vendedores diferentes. Os pagamentos serão processados separadamente de forma segura."
        : null,
    hasSubscription: drafts.some((d) => d.kind === "SUBSCRIPTION"),
    groups,
    paidCount: approved.length,
    pendingCount: pending.length,
    order: primaryOrder,
  };
}

export async function loadCheckoutSession(userId: string, sessionId: string) {
  const orders = await prisma.order.findMany({
    where: { userId, idempotencyKey: { startsWith: `${sessionId}:` } },
    include: { payments: true, items: true, partner: { select: { name: true, partnerProfile: { select: { businessName: true } } } } },
    orderBy: { createdAt: "asc" },
  });
  const groups: CheckoutSessionGroup[] = orders.map((order, index) => {
    const snap = (order.pricingSnapshot as Record<string, unknown> | null) ?? {};
    const session = (snap.checkoutSession as Record<string, unknown> | null) ?? {};
    return {
      index: Number(session.groupIndex ?? index),
      orderId: order.id,
      orderNumber: order.orderNumber,
      sellerId: String(session.sellerId ?? order.partnerId ?? "ECCOPET"),
      sellerName: String(session.sellerName ?? order.partner?.partnerProfile?.businessName ?? order.partner?.name ?? "EccoPet"),
      kind: String(session.kind ?? "PRODUCT") as PaymentGroupDraft["kind"],
      amount: Number(order.total),
      status: order.status,
      paymentStatus: order.payments[0]?.status ?? "PENDING",
      idempotencyKey: order.idempotencyKey ?? "",
    };
  });
  const approved = groups.filter((g) => g.paymentStatus === "APPROVED" || g.status === "PAID");
  const pending = groups.filter((g) => g.paymentStatus !== "APPROVED" && g.status !== "PAID");
  return {
    sessionId,
    groups,
    paidCount: approved.length,
    pendingCount: pending.length,
    status: approved.length === groups.length ? "PAID" : approved.length > 0 ? "PARTIALLY_PAID" : "PENDING",
  };
}
