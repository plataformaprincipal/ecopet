import "server-only";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { AI_AUDIT, writeAiCommerceAudit } from "./audit";
import { getProductDefBySku } from "./catalog";
import { AiCommerceError } from "./errors";
import { grantAccessForPaidItem } from "./subscription-service";

export async function grantEntitlementsForPaidOrder(orderId: string, paymentId?: string | null) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true, payments: true },
  });
  if (!order) return { created: 0 };
  const aiItems = order.items.filter((i) => i.itemType === "DIGITAL_AI" && i.sku && i.petId);
  if (!aiItems.length) return { created: 0 };

  let created = 0;
  await prisma.$transaction(async (tx) => {
    for (const item of aiItems) {
      const existing = await tx.aIEntitlement.findUnique({ where: { orderItemId: item.id } });
      if (existing) continue;
      const product = await tx.aIProduct.findUnique({ where: { sku: item.sku! } });
      const pet = await tx.pet.findFirst({
        where: { id: item.petId!, ownerId: order.userId, deletedAt: null },
        select: { id: true },
      });
      if (!pet) continue;
      await grantAccessForPaidItem({
        tx,
        userId: order.userId,
        petId: pet.id,
        sku: item.sku!,
        orderId: order.id,
        orderItemId: item.id,
        paymentId: paymentId ?? order.payments.find((p) => p.status === "APPROVED")?.id ?? null,
        quantity: item.quantity,
        productId: product?.id ?? null,
      });
      created += 1;
      await writeAiCommerceAudit({
        tx,
        userId: order.userId,
        action: AI_AUDIT.ENTITLEMENT_CREATED,
        sku: item.sku,
        orderId: order.id,
        paymentId: paymentId ?? null,
        metadata: { orderItemId: item.id, quantity: item.quantity },
      });
    }
  });

  if (created > 0) {
    await writeAiCommerceAudit({
      userId: order.userId,
      action: AI_AUDIT.PRODUCT_PURCHASED,
      orderId: order.id,
      paymentId: paymentId ?? null,
      metadata: { created },
    });
  }
  return { created };
}

export async function revokeEntitlementsForOrder(orderId: string, reason: string) {
  const entitlements = await prisma.aIEntitlement.findMany({
    where: { orderId, status: { in: ["AVAILABLE", "ACTIVE", "IN_USE", "RESERVED"] } },
  });
  if (!entitlements.length) return { revoked: 0 };
  await prisma.aIEntitlement.updateMany({
    where: { id: { in: entitlements.map((e) => e.id) } },
    data: { status: reason === "REFUNDED" ? "REFUNDED" : "REVOKED", revokedAt: new Date(), revokeReason: reason },
  });
  for (const e of entitlements) {
    await writeAiCommerceAudit({
      userId: e.userId,
      action: AI_AUDIT.ENTITLEMENT_REVOKED,
      sku: e.sku,
      orderId,
      entitlementId: e.id,
      metadata: { reason },
    });
  }
  return { revoked: entitlements.length };
}

export async function assertPetOwned(userId: string, petId: string) {
  const pet = await prisma.pet.findFirst({
    where: { id: petId, ownerId: userId, deletedAt: null },
  });
  if (!pet) throw new AiCommerceError("PET_FORBIDDEN", "Pet não encontrado.", 403);
  return pet;
}

export async function reserveEntitlementForExecution(params: {
  userId: string;
  entitlementId: string;
  tx: Prisma.TransactionClient;
}) {
  const rows = await params.tx.$queryRaw<Array<{ id: string }>>`
    SELECT id FROM "AIEntitlement"
    WHERE id = ${params.entitlementId} AND "userId" = ${params.userId}
    FOR UPDATE
  `;
  if (!rows.length) throw new AiCommerceError("ENTITLEMENT_UNAVAILABLE", "Utilização não encontrada.", 404);

  const entitlement = await params.tx.aIEntitlement.findUnique({
    where: { id: params.entitlementId },
  });
  if (!entitlement) throw new AiCommerceError("ENTITLEMENT_UNAVAILABLE", "Utilização não encontrada.", 404);
  if (entitlement.userId !== params.userId) {
    throw new AiCommerceError("ENTITLEMENT_FORBIDDEN", "Utilização não encontrada.", 403);
  }
  if (entitlement.status === "REVOKED" || entitlement.status === "REFUNDED" || entitlement.status === "EXPIRED") {
    throw new AiCommerceError("ENTITLEMENT_UNAVAILABLE", "Esta utilização não está mais disponível.", 409);
  }
  if (entitlement.usageCount >= entitlement.usageLimit && entitlement.status === "CONSUMED") {
    throw new AiCommerceError("ENTITLEMENT_UNAVAILABLE", "Esta utilização já foi concluída.", 409);
  }
  if ((entitlement.status === "IN_USE" || entitlement.status === "RESERVED") && entitlement.reservedExecutionId) {
    const existing = await params.tx.aIExecution.findUnique({
      where: { id: entitlement.reservedExecutionId },
    });
    if (existing && (existing.status === "DRAFT" || existing.status === "QUEUED" || existing.status === "PROCESSING" || existing.status === "CREATED")) {
      return { entitlement, execution: existing, reused: true as const };
    }
  }
  if (!["AVAILABLE", "ACTIVE", "IN_USE", "RESERVED"].includes(entitlement.status)) {
    throw new AiCommerceError("ENTITLEMENT_UNAVAILABLE", "Utilização indisponível.", 409);
  }
  if (entitlement.usageCount >= entitlement.usageLimit) {
    throw new AiCommerceError("ENTITLEMENT_UNAVAILABLE", "Esta utilização já foi concluída.", 409);
  }

  const def = getProductDefBySku(entitlement.sku);
  const execution = await params.tx.aIExecution.create({
    data: {
      userId: entitlement.userId,
      petId: entitlement.petId,
      productId: entitlement.productId,
      entitlementId: entitlement.id,
      capabilityId: def?.capabilityId ?? entitlement.sku,
      status: "DRAFT",
      promptVersion: def?.promptVersion ?? "v1",
    },
  });
  await params.tx.aIEntitlement.update({
    where: { id: entitlement.id },
    data: {
      status: "IN_USE",
      reservedExecutionId: execution.id,
      activatedAt: entitlement.activatedAt ?? new Date(),
    },
  });
  return { entitlement, execution, reused: false as const };
}

export async function consumeEntitlement(params: {
  tx: Prisma.TransactionClient;
  entitlementId: string;
  executionId: string;
}) {
  const entitlement = await params.tx.aIEntitlement.findUnique({ where: { id: params.entitlementId } });
  if (!entitlement) return;
  const nextCount = entitlement.usageCount + 1;
  const done = nextCount >= entitlement.usageLimit;
  await params.tx.aIEntitlement.update({
    where: { id: entitlement.id },
    data: {
      usageCount: nextCount,
      reservedExecutionId: null,
      status: done ? "CONSUMED" : "AVAILABLE",
      consumedAt: done ? new Date() : entitlement.consumedAt,
    },
  });
  if (done) {
    await writeAiCommerceAudit({
      tx: params.tx,
      userId: entitlement.userId,
      action: AI_AUDIT.ENTITLEMENT_CONSUMED,
      sku: entitlement.sku,
      entitlementId: entitlement.id,
      executionId: params.executionId,
      orderId: entitlement.orderId,
    });
  }
}

export async function restoreEntitlement(params: { tx: Prisma.TransactionClient; entitlementId: string }) {
  const entitlement = await params.tx.aIEntitlement.findUnique({ where: { id: params.entitlementId } });
  if (!entitlement) return;
  if (entitlement.status === "REVOKED" || entitlement.status === "REFUNDED" || entitlement.status === "CONSUMED") {
    return;
  }
  await params.tx.aIEntitlement.update({
    where: { id: entitlement.id },
    data: {
      status: entitlement.usageCount >= entitlement.usageLimit ? "CONSUMED" : "AVAILABLE",
      reservedExecutionId: null,
    },
  });
}

export async function listUserEntitlements(userId: string) {
  return prisma.aIEntitlement.findMany({
    where: { userId },
    include: {
      pet: { select: { id: true, name: true, species: true, breed: true, photo: true, birthDate: true } },
      product: { select: { name: true, slug: true, sku: true } },
      executions: { orderBy: { createdAt: "desc" }, take: 3 },
    },
    orderBy: { createdAt: "desc" },
  });
}
