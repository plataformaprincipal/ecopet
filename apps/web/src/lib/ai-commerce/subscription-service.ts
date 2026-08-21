import "server-only";
import { createHash } from "crypto";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { getProductDefBySku, isActivationSku, isRecurringSku } from "./catalog";

const PERIOD_MS = 30 * 24 * 60 * 60 * 1000;

export async function grantAccessForPaidItem(params: {
  tx: Prisma.TransactionClient;
  userId: string;
  petId: string;
  sku: string;
  orderId: string;
  orderItemId: string;
  paymentId: string | null;
  quantity: number;
  productId: string | null;
}) {
  const def = getProductDefBySku(params.sku);
  const quantity = Math.max(1, params.quantity);
  const usageLimit = Math.max(1, (def?.usageLimit ?? 1) * quantity);
  const now = new Date();

  let subscriptionId: string | null = null;
  if (def && isRecurringSku(def.sku)) {
    const sub = await params.tx.aISubscription.create({
      data: {
        userId: params.userId,
        petId: params.petId,
        sku: params.sku,
        productId: params.productId,
        status: "ACTIVE",
        currentPeriodStart: now,
        currentPeriodEnd: new Date(now.getTime() + PERIOD_MS),
        usageAllowance: usageLimit,
        usageCount: 0,
        orderId: params.orderId,
      },
    });
    subscriptionId = sub.id;
  }

  const status = def && isActivationSku(def.sku) ? "ACTIVE" : "AVAILABLE";
  const entitlement = await params.tx.aIEntitlement.create({
    data: {
      userId: params.userId,
      petId: params.petId,
      sku: params.sku,
      productId: params.productId,
      orderId: params.orderId,
      orderItemId: params.orderItemId,
      paymentId: params.paymentId,
      subscriptionId,
      status,
      usageLimit,
      usageCount: 0,
      purchasedAt: now,
      activatedAt: status === "ACTIVE" ? now : null,
      expiresAt: subscriptionId ? new Date(now.getTime() + PERIOD_MS) : null,
    },
  });

  if (def && isActivationSku(def.sku)) {
    await params.tx.petHealthProfile.upsert({
      where: { petId: params.petId },
      create: {
        petId: params.petId,
        userId: params.userId,
        activatedFromEntitlementId: entitlement.id,
      },
      update: { activatedFromEntitlementId: entitlement.id },
    });
  }

  return entitlement;
}

export async function cancelSubscriptionAtPeriodEnd(params: { userId: string; subscriptionId: string }) {
  const sub = await prisma.aISubscription.findFirst({
    where: { id: params.subscriptionId, userId: params.userId },
  });
  if (!sub) return null;
  return prisma.aISubscription.update({
    where: { id: sub.id },
    data: { cancelAtPeriodEnd: true },
  });
}

export function verificationHash(reportId: string, executionId: string) {
  return createHash("sha256").update(`${reportId}:${executionId}`).digest("hex").slice(0, 16);
}
