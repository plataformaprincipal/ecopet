import "server-only";

import type { OrderStatus } from "@prisma/client";
import { humanizeOrderPricing } from "@/lib/finance/metrics";
import {
  eccopetFinancialLabel,
  eccopetOperationalLabel,
  isDigitalEccopetItemType,
  isEccopetSelfFulfilledItem,
  orderFilterBuckets,
  resolveEccopetAccess,
  type ClientOrderFilter,
} from "@/lib/commerce/eccopet-access";

const PAYMENT_METHOD_LABEL: Record<string, string> = {
  PIX: "Pix",
  CARD: "Cartão",
  BOLETO: "Boleto",
  CASH: "Dinheiro",
};

type EntitlementLite = {
  id: string;
  sku: string;
  status: string;
  orderItemId?: string | null;
  purchasedAt?: Date | string | null;
  activatedAt?: Date | string | null;
  startsAt?: Date | string | null;
  expiresAt?: Date | string | null;
  endsAt?: Date | string | null;
  usageCount?: number | null;
  usageLimit?: number | null;
};

type ItemLite = {
  id: string;
  name: string;
  quantity: number;
  price: number;
  sku?: string | null;
  itemType?: string | null;
  partnerId?: string | null;
  petId?: string | null;
};

type PaymentLite = {
  id: string;
  status: string;
  paymentMethod?: string | null;
  amount?: number | null;
  approvedAt?: Date | string | null;
  createdAt?: Date | string;
  provider?: string | null;
  environment?: string | null;
  currency?: string | null;
  statusDetail?: string | null;
  cancelledAt?: Date | string | null;
  refundedAt?: Date | string | null;
};

type OrderLite = {
  id: string;
  orderNumber: number;
  userId: string;
  partnerId?: string | null;
  status: OrderStatus | string;
  fulfillmentStatus?: OrderStatus | string | null;
  total: number;
  createdAt: Date | string;
  paymentMethod?: string | null;
  trackingCode?: string | null;
  trackingUrl?: string | null;
  carrierName?: string | null;
  sellerAcceptBy?: Date | string | null;
  pricingVersion?: string | null;
  items: ItemLite[];
  payments?: PaymentLite[];
  statusHistory?: Array<{ status: string; note?: string | null; createdAt: Date | string }>;
  aiEntitlements?: EntitlementLite[];
  catalogEntitlements?: EntitlementLite[];
  catalogSubscriptions?: Array<{
    id: string;
    sku: string;
    status: string;
    billingCycle?: string | null;
    currentPeriodEnd?: Date | string | null;
    cancelAtPeriodEnd?: boolean | null;
  }>;
  partner?: { name?: string | null } | null;
};

function iso(value: Date | string | null | undefined) {
  if (!value) return null;
  return value instanceof Date ? value.toISOString() : String(value);
}

function entitlementForItem(order: OrderLite, item: ItemLite): EntitlementLite | undefined {
  return (
    order.aiEntitlements?.find((row) => row.orderItemId === item.id) ??
    order.catalogEntitlements?.find((row) => row.orderItemId === item.id) ??
    order.aiEntitlements?.find((row) => row.sku === item.sku) ??
    order.catalogEntitlements?.find((row) => row.sku === item.sku)
  );
}

function isUsableEntitlement(status: string | undefined) {
  return ["AVAILABLE", "ACTIVE", "IN_USE", "RESERVED"].includes(String(status || ""));
}

export function serializeClientOrder(order: OrderLite) {
  const latestPayment = (order.payments ?? [])[0] ?? null;
  const paid =
    order.status === "PAID" ||
    order.status === "PARTIALLY_REFUNDED" ||
    latestPayment?.status === "APPROVED";
  const partnerName = order.partner?.name?.trim() || null;

  const items = order.items.map((item) => {
    const selfFulfilled = isEccopetSelfFulfilledItem({
      sku: item.sku,
      itemType: item.itemType,
      partnerId: item.partnerId,
    });
    const digital = isDigitalEccopetItemType(item.itemType) || Boolean(resolveEccopetAccess(item.sku));
    const access = resolveEccopetAccess(item.sku);
    const entitlement = entitlementForItem(order, item);
    const entitlementStatus = entitlement?.status ?? null;
    const usable = isUsableEntitlement(entitlementStatus ?? undefined);
    const expired = ["EXPIRED", "CONSUMED"].includes(String(entitlementStatus || ""));
    const releasing = Boolean(paid && selfFulfilled && digital && !entitlement && order.status !== "REFUNDED");
    const operationalLabel = eccopetOperationalLabel({
      paid,
      selfFulfilled,
      digital,
      orderStatus: String(order.status),
      entitlementStatus,
      releasing,
    });
    const remaining = Math.max(0, (entitlement?.usageLimit ?? 0) - (entitlement?.usageCount ?? 0));
    const repurchaseHref = access?.href ?? "/eccopet";
    const cta =
      !paid || order.status === "REFUNDED" || order.status === "CANCELLED"
        ? null
        : expired
          ? {
              href: repurchaseHref,
              label: access?.family === "ONE" || access?.family === "PRO" ? "Renovar" : "Comprar novamente",
            }
          : releasing
            ? null
            : selfFulfilled && usable
              ? { href: access?.href ?? "/eccopet", label: access?.ctaLabel ?? "Usar agora" }
              : !selfFulfilled
                ? { href: `/dashboard/client/orders/${order.id}`, label: "Acompanhar pedido" }
                : { href: access?.href ?? "/eccopet", label: access?.ctaLabel ?? "Usar agora" };

    return {
      id: item.id,
      name: item.name,
      quantity: item.quantity,
      price: item.price,
      sku: item.sku ?? null,
      itemType: item.itemType ?? "product",
      petId: item.petId ?? null,
      sellerKind: selfFulfilled ? ("ECCOPET" as const) : ("PARCEIRO" as const),
      sellerName: selfFulfilled ? "EccoPet" : partnerName || "Parceiro",
      digital,
      selfFulfilled,
      operationalLabel,
      accessAvailable: Boolean(paid && selfFulfilled && usable),
      releasing,
      expired,
      cta,
      entitlement: entitlement
        ? {
            id: entitlement.id,
            status: entitlement.status,
            purchasedAt: iso(entitlement.purchasedAt),
            activatedAt: iso(entitlement.activatedAt ?? entitlement.startsAt),
            expiresAt: iso(entitlement.expiresAt ?? entitlement.endsAt),
            usageCount: entitlement.usageCount ?? 0,
            usageLimit: entitlement.usageLimit ?? 1,
            remaining,
          }
        : null,
      subscription: order.catalogSubscriptions?.find((row) => row.sku === item.sku)
        ? {
            id: order.catalogSubscriptions.find((row) => row.sku === item.sku)!.id,
            status: order.catalogSubscriptions.find((row) => row.sku === item.sku)!.status,
            billingCycle: order.catalogSubscriptions.find((row) => row.sku === item.sku)!.billingCycle ?? null,
            currentPeriodEnd: iso(order.catalogSubscriptions.find((row) => row.sku === item.sku)!.currentPeriodEnd),
            cancelAtPeriodEnd: Boolean(order.catalogSubscriptions.find((row) => row.sku === item.sku)!.cancelAtPeriodEnd),
            href: "/cliente/assinaturas",
          }
        : null,
    };
  });

  const filters: ClientOrderFilter[] = orderFilterBuckets({
    status: String(order.status),
    paid,
    items: items.map((item) => ({
      selfFulfilled: item.selfFulfilled,
      accessAvailable: item.accessAvailable,
      releasing: item.releasing,
    })),
  });

  const platformDigital = items.filter((item) => item.selfFulfilled && item.digital);
  const partnerItems = items.filter((item) => !item.selfFulfilled);
  const showLogistics = partnerItems.length > 0 && !items.every((item) => item.digital && item.selfFulfilled);

  const financialStatus = eccopetFinancialLabel(latestPayment?.status ?? String(order.status));
  const headline = platformDigital.length && paid && !partnerItems.length
    ? items.some((item) => item.releasing)
      ? "Liberando seu acesso..."
      : "Pagamento aprovado · acesso liberado"
    : partnerItems.length && paid && ["PAID", "PENDING_CONFIRMATION"].includes(String(order.status))
      ? platformDigital.length
        ? "Pedido misto"
        : "Pagamento aprovado · aguardando confirmação do parceiro"
      : eccopetOperationalLabel({
          paid,
          selfFulfilled: !order.partnerId,
          digital: platformDigital.length > 0,
          orderStatus: String(order.status),
        });

  const pricing = humanizeOrderPricing(order);
  const safePayments = (order.payments ?? []).map((payment) => ({
    id: payment.id,
    status: payment.status,
    paymentMethod: payment.paymentMethod ?? null,
    amount: payment.amount ?? null,
    approvedAt: iso(payment.approvedAt),
    createdAt: iso(payment.createdAt),
  }));

  return {
    id: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    fulfillmentStatus: order.fulfillmentStatus ?? order.status,
    total: order.total,
    createdAt: iso(order.createdAt),
    paymentMethod: order.paymentMethod ?? latestPayment?.paymentMethod ?? null,
    paymentMethodLabel: PAYMENT_METHOD_LABEL[String(order.paymentMethod ?? latestPayment?.paymentMethod ?? "")] ?? order.paymentMethod ?? latestPayment?.paymentMethod ?? null,
    financialStatus,
    operationalLabel: headline,
    partnerId: order.partnerId ?? null,
    sellerName: partnerItems.length && !platformDigital.length ? partnerName || "Parceiro" : platformDigital.length && !partnerItems.length ? "EccoPet" : "Misto",
    trackingCode: showLogistics ? order.trackingCode ?? null : null,
    trackingUrl: showLogistics ? order.trackingUrl ?? null : null,
    carrierName: showLogistics ? order.carrierName ?? null : null,
    sellerAcceptBy: partnerItems.length ? iso(order.sellerAcceptBy) : null,
    showLogistics,
    mixed: platformDigital.length > 0 && partnerItems.length > 0,
    accessAvailable: items.some((item) => item.accessAvailable),
    releasing: items.some((item) => item.releasing),
    filters,
    items,
    statusHistory: showLogistics ? order.statusHistory ?? [] : (order.statusHistory ?? []).filter((h) => h.note === "SELF_FULFILLED" || !["SHIPPED", "OUT_FOR_DELIVERY", "DELIVERED"].includes(h.status)),
    payments: safePayments,
    pricing,
    pricingVersion: order.pricingVersion ?? null,
    receipt: paid
      ? {
          orderId: order.id,
          orderNumber: order.orderNumber,
          paymentId: latestPayment?.id ?? null,
          amount: Number(latestPayment?.amount ?? order.total),
          currency: "BRL",
          paymentMethod: PAYMENT_METHOD_LABEL[String(latestPayment?.paymentMethod ?? order.paymentMethod ?? "")] ?? latestPayment?.paymentMethod ?? order.paymentMethod,
          paidAt: iso(latestPayment?.approvedAt ?? order.createdAt),
          seller: partnerItems.length && !platformDigital.length ? partnerName || "Parceiro" : "EccoPet",
          items: items.map((item) => ({ name: item.name, quantity: item.quantity, price: item.price, sku: item.sku })),
        }
      : null,
  };
}

export type SerializedClientOrder = ReturnType<typeof serializeClientOrder>;
