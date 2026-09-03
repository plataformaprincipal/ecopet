import "server-only";
import { DeliveryMethod, OrderStatus, PaymentMethod, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { assertCheckoutEnabled } from "@/lib/commerce/checkout-flags";
import { writeAuditLog } from "@/lib/audit-log";
import { createInternalNotification } from "@/lib/notifications/internal";
import { CATALOG_ITEM_TYPE, ENTERTAINMENT_SKU, familyOfSku, getCommercialProduct } from "./products";
import { quoteCatalogSku } from "./quote";
import { grantCatalogPurchase } from "./fulfill";

export class CatalogCommerceError extends Error {
  constructor(
    public code: string,
    message: string,
    public status = 400
  ) {
    super(message);
    this.name = "CatalogCommerceError";
  }
}

export async function checkoutCatalogSku(params: {
  userId: string;
  sku: string;
  petId?: string | null;
  billingCycle?: "month" | "year";
  urgent?: boolean;
  caseId?: string | null;
  idempotencyKey?: string | null;
  role?: string;
}) {
  assertCheckoutEnabled();
  if (params.sku === ENTERTAINMENT_SKU) {
    throw new CatalogCommerceError("PRICE_PENDING", "Plano de Entretenimento sem preço oficial no PFO. Cobrança desligada.", 409);
  }

  if (params.idempotencyKey) {
    const existing = await prisma.order.findUnique({
      where: { idempotencyKey: params.idempotencyKey },
      include: { items: true, payments: true },
    });
    if (existing) {
      if (existing.userId !== params.userId) throw new CatalogCommerceError("IDEMPOTENCY_CONFLICT", "Conflito de idempotência.", 409);
      return { order: existing, free: existing.total === 0 };
    }
  }

  const quoted = await quoteCatalogSku(params.sku, {
    billingCycle: params.billingCycle,
    urgent: params.urgent,
  });
  const product = getCommercialProduct(params.sku);
  if (product?.partnerPanel && params.role && !["PARTNER", "CLINIC", "VETERINARIAN", "ADMIN", "PETSHOP", "SELLER", "SERVICE_PROVIDER"].includes(params.role) && quoted.family === "PRO") {
    throw new CatalogCommerceError("FORBIDDEN", "Este plano é exclusivo de parceiros.", 403);
  }
  if (quoted.petRequired) {
    if (!params.petId) throw new CatalogCommerceError("PET_REQUIRED", "Selecione o pet.", 400);
    const pet = await prisma.pet.findFirst({
      where: { id: params.petId, ownerId: params.userId, deletedAt: null },
      select: { id: true },
    });
    if (!pet) throw new CatalogCommerceError("PET_FORBIDDEN", "Pet não encontrado.", 403);
  }
  if (!quoted.purchasable || !quoted.billingEnabled) {
    throw new CatalogCommerceError(
      quoted.status,
      quoted.status === "PARTNER_REQUIRED"
        ? "Este item exige parceiro habilitado/operador autorizado. Catálogo visível, cobrança bloqueada."
        : "Este item não está disponível para compra.",
      409
    );
  }
  const customerCents = quoted.quote?.customerAmountCents ?? quoted.amountCents ?? 0;
  if (customerCents < 0) throw new CatalogCommerceError("INVALID_AMOUNT", "Valor inválido.", 400);
  const isFree = customerCents === 0;
  if (!isFree && customerCents <= 0) throw new CatalogCommerceError("INVALID_AMOUNT", "Valor inválido.", 400);

  const setupCents = quoted.setupAmountCents ?? 0;
  const totalCents = customerCents + setupCents;
  const total = totalCents / 100;
  const snapshot = quoted.quote?.snapshot ?? { sku: params.sku, pricingVersion: quoted.pricingVersion };

  const order = await prisma.$transaction(async (tx) => {
    const maxNum = (await tx.order.aggregate({ _max: { orderNumber: true } }))._max.orderNumber ?? 1000;
    const created = await tx.order.create({
      data: {
        orderNumber: maxNum + 1,
        userId: params.userId,
        partnerId: null,
        status: isFree ? OrderStatus.PAID : OrderStatus.PENDING,
        fulfillmentStatus: isFree ? OrderStatus.PAID : OrderStatus.PENDING,
        total,
        grossAmount: total,
        discount: 0,
        platformFeeAmount: ((quoted.quote?.eccopetCommissionCents ?? 0) + (quoted.quote?.fixedFeeCents ?? 0) + (quoted.quote?.bookingFeeCents ?? 0)) / 100,
        partnerAmount: (quoted.quote?.estimatedPayoutCents ?? 0) / 100,
        platformPercentage: (quoted.quote?.commissionPercentBps ?? 0) / 100,
        platformFixedFee: ((quoted.quote?.fixedFeeCents ?? 0) + (quoted.quote?.bookingFeeCents ?? 0) + (quoted.quote?.urgentFeeCents ?? 0)) / 100,
        reserveAmount: (quoted.quote?.reserveCents ?? 0) / 100,
        pricingVersion: quoted.pricingVersion,
        pricingSnapshot: {
          kind: CATALOG_ITEM_TYPE,
          family: quoted.family,
          billingCycle: quoted.billingCycle,
          splitReady: false,
          snapshot,
        } as Prisma.InputJsonValue,
        currency: "BRL",
        idempotencyKey: params.idempotencyKey || null,
        shippingAddress: { digital: true },
        deliveryMethod: DeliveryMethod.PICKUP_LOCAL,
        paymentMethod: isFree ? PaymentMethod.PIX : PaymentMethod.PIX,
        deliveryNotes: CATALOG_ITEM_TYPE,
        items: {
          create: [
            {
              productId: null,
              itemType: CATALOG_ITEM_TYPE,
              name: quoted.name,
              quantity: 1,
              price: total,
              grossAmount: total,
              platformFeeAmount: ((quoted.quote?.eccopetCommissionCents ?? 0) + (quoted.quote?.fixedFeeCents ?? 0)) / 100,
              partnerAmount: (quoted.quote?.estimatedPayoutCents ?? 0) / 100,
              pricingVersion: quoted.pricingVersion,
              sku: params.sku,
              petId: params.petId ?? null,
              metadata: {
                family: familyOfSku(params.sku),
                billingCycle: quoted.billingCycle,
                setupAmountCents: setupCents,
                caseId: params.caseId ?? null,
                snapshot,
              } as Prisma.InputJsonValue,
            },
          ],
        },
      },
      include: { items: true, payments: true },
    });
    return created;
  });

  await writeAuditLog({
    actorId: params.userId,
    action: "CREATE",
    module: "commerce",
    resource: "Order",
    resourceId: order.id,
    metadata: { sku: params.sku, total, free: isFree },
  });

  if (isFree) {
    await grantCatalogPurchase({ orderId: order.id });
    await createInternalNotification({
      userId: params.userId,
      title: `${quoted.name} ativado`,
      body: "Plano gratuito ativado. Histórico preservado.",
      type: "PAYMENT",
      actionUrl: "/cliente/assinaturas",
      data: { orderId: order.id, sku: params.sku },
    });
  }

  return { order, free: isFree, quoted };
}
