import "server-only";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { CATALOG_ITEM_TYPE, familyOfSku, getCommercialProduct } from "./products";
import { quoteCatalogSku } from "./quote";

function periodEnd(cycle: string | null | undefined, from = new Date()) {
  const end = new Date(from);
  if (cycle === "year") end.setFullYear(end.getFullYear() + 1);
  else end.setMonth(end.getMonth() + 1);
  return end;
}

export async function grantCatalogPurchase(params: { orderId: string; paymentId?: string | null }) {
  const order = await prisma.order.findUnique({
    where: { id: params.orderId },
    include: { items: true, payments: true },
  });
  if (!order) return { created: 0 };
  const items = order.items.filter((i) => i.itemType === CATALOG_ITEM_TYPE && i.sku);
  if (!items.length) return { created: 0 };

  let created = 0;
  for (const item of items) {
    const existing = await prisma.catalogEntitlement.findUnique({ where: { orderItemId: item.id } }).catch(() => null);
    if (existing) continue;
    const sku = item.sku!;
    const family = familyOfSku(sku);
    const product = getCommercialProduct(sku);
    const quoted = await quoteCatalogSku(sku);
    const now = new Date();
    const recurring = product?.recurring ?? quoted.recurring;
    let subscriptionId: string | null = null;

    if (recurring) {
      const sub = await prisma.catalogSubscription.create({
        data: {
          userId: order.userId,
          sku,
          family,
          billingCycle: quoted.billingCycle ?? "month",
          status: "ACTIVE",
          amountCents: quoted.amountCents ?? Math.round(item.price * 100),
          annualAmountCents: quoted.annualAmountCents,
          setupAmountCents: quoted.setupAmountCents,
          pricingVersion: item.pricingVersion,
          pricingSnapshot: (quoted.quote?.snapshot ?? undefined) as Prisma.InputJsonValue | undefined,
          billingEnabled: quoted.billingEnabled,
          currentPeriodStart: now,
          currentPeriodEnd: periodEnd(quoted.billingCycle),
          orderId: order.id,
        },
      });
      subscriptionId = sub.id;
    }

    if (family === "PROTECT" || family === "HEALTH_PLAN") {
      await prisma.protectionEnrollment.create({
        data: {
          userId: order.userId,
          petId: item.petId,
          sku,
          status: "PENDING_PARTNER",
          amountCents: quoted.amountCents ?? Math.round(item.price * 100),
          orderId: order.id,
          coverageJson: { note: "Cobertura só após operador autorizado." },
          exclusionsJson: { note: "EccoPet não assume risco securitário." },
        },
      });
    }

    if (family === "TELEHEALTH" || family === "EXAMS" || family === "HEALTH_DIGITAL") {
      const kind =
        sku === "SAU-008"
          ? "TELECONSULT"
          : sku === "SAU-007"
            ? "TELEORIENTATION"
            : sku === "SAU-009"
              ? "SECOND_OPINION"
              : sku === "SAU-006"
                ? "TRIAGE"
                : sku.startsWith("SAU-01")
                  ? "REPORT"
                  : "EXAM_REVIEW";
      const meta = (item.metadata ?? {}) as Record<string, unknown>;
      const existingCaseId = typeof meta.caseId === "string" ? meta.caseId : null;
      if (existingCaseId) {
        await prisma.healthClinicalCase.updateMany({
          where: { id: existingCaseId, userId: order.userId },
          data: { status: "PAID", orderId: order.id },
        });
      } else if (item.petId) {
        await prisma.healthClinicalCase.create({
          data: {
            kind,
            status: "PAID",
            sku,
            userId: order.userId,
            petId: item.petId,
            orderId: order.id,
            auditTrail: {
              events: [{ at: now.toISOString(), action: "PAID", actor: "system" }],
              aiDisclaimer: "IA não emite laudo/diagnóstico/atestado definitivo.",
            },
          },
        });
      }
    }

    await prisma.catalogEntitlement.create({
      data: {
        userId: order.userId,
        petId: item.petId,
        sku,
        family,
        status: "ACTIVE",
        usageLimit: 1,
        usageCount: 0,
        startsAt: now,
        endsAt: recurring ? periodEnd(quoted.billingCycle) : null,
        orderId: order.id,
        orderItemId: item.id,
        subscriptionId,
        paymentId: params.paymentId ?? order.payments.find((p) => p.status === "APPROVED")?.id ?? null,
        metadata: { pricingVersion: item.pricingVersion },
      },
    });
    created += 1;
  }
  return { created };
}

export async function revokeCatalogPurchase(orderId: string, reason: string) {
  await prisma.catalogEntitlement.updateMany({
    where: { orderId, status: { in: ["AVAILABLE", "ACTIVE"] } },
    data: { status: reason === "REFUNDED" ? "REFUNDED" : "REVOKED" },
  });
  await prisma.catalogSubscription.updateMany({
    where: { orderId, status: { in: ["ACTIVE", "PENDING", "CANCEL_SCHEDULED"] } },
    data: { status: "CANCELLED", cancelledAt: new Date(), cancelReason: reason },
  });
}
