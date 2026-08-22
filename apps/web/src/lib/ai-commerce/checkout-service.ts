import "server-only";
import { prisma } from "@/lib/prisma";
import { DeliveryMethod, OrderStatus, PaymentMethod, Prisma } from "@prisma/client";
import { assertCheckoutEnabled } from "@/lib/commerce/checkout-flags";
import { quoteCouponInTx, consumeCouponInCheckout, CouponError } from "@/lib/commerce/apply-coupon";
import { couponToEngineInput } from "@/lib/pricing/service";
import { getOrCreateCart } from "@/lib/cart/cart-service";
import { writeAuditLog } from "@/lib/audit-log";
import { createInternalNotification } from "@/lib/notifications/internal";
import { emailOrderEvent } from "@/lib/mail/event-dispatch";
import { getUserEmailLocale } from "@/lib/email/templates";
import { AI_COMMERCE_ITEM_TYPE, assertAiPaidCheckoutEnabled, isAiCommerceSku } from "./flags";
import { quoteAiSku } from "./pricing";
import { getProductDefBySku } from "./catalog";
import { assertPetOwned } from "./entitlement-service";
import { AiCommerceError } from "./errors";
import { writeAiCommerceAudit, AI_AUDIT } from "./audit";
import { ensureAiCommerceProducts } from "./product-service";
import { couponAllowsSku } from "./coupon-policy";

const ECCOPONTOS_DIGITAL_AI_POLICY = {
  redeemAllowed: false,
  earnOnPaid: true,
  reason: "DIGITAL_AI não consome EccoPontos no checkout. Pontos são creditados após PAID pelo ledger existente.",
} as const;

export async function checkoutAiFromCart(params: {
  userId: string;
  idempotencyKey?: string | null;
  couponCode?: string | null;
}) {
  assertCheckoutEnabled();
  assertAiPaidCheckoutEnabled();
  await ensureAiCommerceProducts();

  if (params.idempotencyKey) {
    const existing = await prisma.order.findUnique({
      where: { idempotencyKey: params.idempotencyKey },
      include: { items: true, payments: true },
    });
    if (existing) {
      if (existing.userId !== params.userId) throw new AiCommerceError("IDEMPOTENCY_CONFLICT", "Conflito de idempotência.", 409);
      return existing;
    }
  }

  const cart = await getOrCreateCart(params.userId);
  const aiItems = cart.items.filter((i) => i.itemType === AI_COMMERCE_ITEM_TYPE && i.sku);
  if (!aiItems.length) throw new AiCommerceError("CART_EMPTY", "Nenhum serviço de IA no carrinho.", 400);

  const order = await prisma.$transaction(async (tx) => {
    const lines: Array<{
      sku: string;
      petId: string;
      name: string;
      quantity: number;
      unitPrice: number;
      grossAmount: number;
      platformFeeAmount: number;
      pricingVersion: string;
      snapshot: Record<string, unknown>;
    }> = [];

    for (const item of aiItems) {
      if (!item.sku || !isAiCommerceSku(item.sku)) {
        throw new AiCommerceError("SKU_UNKNOWN", "SKU de IA inválido.", 400);
      }
      if (!item.petId) throw new AiCommerceError("PET_REQUIRED", "Selecione o pet para cada serviço.", 400);
      await assertPetOwned(params.userId, item.petId);
      const def = getProductDefBySku(item.sku);
      if (!def) throw new AiCommerceError("SKU_UNKNOWN", "Ferramenta não encontrada.", 404);
      const { quote, resolved } = await quoteAiSku({ sku: item.sku, quantity: item.quantity });
      if (!resolved.purchasable || quote.blockedReasons.length) {
        throw new AiCommerceError(
          "NOT_PURCHASABLE",
          resolved.commercialPending
            ? "Preço em confirmação comercial. A compra está temporariamente indisponível."
            : "Esta ferramenta não está disponível para compra.",
          409
        );
      }
      if (quote.customerAmountCents <= 0) {
        throw new AiCommerceError("INVALID_AMOUNT", "Valor inválido.", 400);
      }
      lines.push({
        sku: item.sku,
        petId: item.petId,
        name: def.name,
        quantity: item.quantity,
        unitPrice: resolved.priceInCents / 100,
        grossAmount: quote.baseAmountCents / 100,
        platformFeeAmount: (quote.eccopetCommissionCents + quote.fixedFeeCents) / 100,
        pricingVersion: quote.pricingVersion,
        snapshot: quote.snapshot,
      });
    }

    const grossBrl = lines.reduce((s, l) => s + l.unitPrice * l.quantity, 0);
    const couponCode = params.couponCode?.trim().toUpperCase() || null;
    let discountAmount = 0;
    let couponInput: ReturnType<typeof couponToEngineInput> | null = null;
    if (couponCode) {
      const coupon = await tx.coupon.findUnique({ where: { code: couponCode } });
      if (!coupon) throw new CouponError("Cupom inválido.", "COUPON_NOT_FOUND", 404);
      const allEligible = lines.every((l) => couponAllowsSku(coupon.eligibleSkus, l.sku));
      if (!allEligible) {
        throw new AiCommerceError("COUPON_SKU", "Este cupom não se aplica aos serviços de IA selecionados.", 400);
      }
      const quoted = await quoteCouponInTx(tx, {
        userId: params.userId,
        code: couponCode,
        grossBrl,
      });
      discountAmount = quoted.discountAmount;
      couponInput = couponToEngineInput(quoted.coupon);
    }
    void couponInput;
    void ECCOPONTOS_DIGITAL_AI_POLICY;

    const total = Math.max(0, Math.round((grossBrl - discountAmount) * 100) / 100);
    if (!(total > 0)) throw new AiCommerceError("INVALID_AMOUNT", "Total inválido.", 400);

    const maxNum = (await tx.order.aggregate({ _max: { orderNumber: true } }))._max.orderNumber ?? 1000;
    const created = await tx.order.create({
      data: {
        orderNumber: maxNum + 1,
        userId: params.userId,
        partnerId: null,
        status: OrderStatus.PENDING,
        fulfillmentStatus: OrderStatus.PENDING,
        total,
        grossAmount: grossBrl,
        discount: discountAmount,
        platformFeeAmount: lines.reduce((s, l) => s + l.platformFeeAmount, 0),
        partnerAmount: 0,
        pricingVersion: lines[0]!.pricingVersion,
        pricingSnapshot: {
          kind: AI_COMMERCE_ITEM_TYPE,
          eccopontos: ECCOPONTOS_DIGITAL_AI_POLICY,
          lines: lines.map((l) => l.snapshot),
        } as Prisma.InputJsonValue,
        currency: "BRL",
        idempotencyKey: params.idempotencyKey || null,
        shippingAddress: { digital: true },
        deliveryMethod: DeliveryMethod.PICKUP_LOCAL,
        paymentMethod: PaymentMethod.PIX,
        deliveryNotes: "DIGITAL_AI",
        items: {
          create: lines.map((line) => ({
            productId: null,
            itemType: AI_COMMERCE_ITEM_TYPE,
            name: line.name,
            quantity: line.quantity,
            price: line.unitPrice,
            grossAmount: line.unitPrice * line.quantity,
            platformFeeAmount: line.platformFeeAmount,
            partnerAmount: 0,
            pricingVersion: line.pricingVersion,
            sku: line.sku,
            petId: line.petId,
            metadata: { capabilityId: getProductDefBySku(line.sku)?.capabilityId },
          })),
        },
        statusHistory: {
          create: {
            status: OrderStatus.PENDING,
            note: `Pedido digital AI — pricing=${lines[0]!.pricingVersion}`,
          },
        },
        payments: {
          create: {
            provider: "pending",
            environment: process.env.MERCADO_PAGO_ENVIRONMENT === "production" ? "production" : "test",
            amount: total,
            currency: "BRL",
            status: "PENDING",
            paymentMethod: PaymentMethod.PIX,
            userId: params.userId,
            metadata: {
              source: "ai-commerce-checkout",
              kind: AI_COMMERCE_ITEM_TYPE,
              pricingVersion: lines[0]!.pricingVersion,
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
        grossBrl,
        orderId: created.id,
      });
    }

    await tx.cartItem.deleteMany({
      where: { cartId: cart.id, itemType: AI_COMMERCE_ITEM_TYPE },
    });
    return created;
  });

  await Promise.all([
    createInternalNotification({
      userId: params.userId,
      title: "Pedido de IA criado",
      body: `Seu pedido #${order.orderNumber} está aguardando pagamento.`,
      type: "ORDER_CREATED",
      actionUrl: `/eccopet/confirmacao/${order.id}`,
      data: { orderId: order.id },
    }),
    writeAuditLog({
      actorId: params.userId,
      action: "CREATE",
      module: "ai-commerce.checkout",
      resource: "Order",
      resourceId: order.id,
      entityAfter: { orderNumber: order.orderNumber, total: order.total, kind: AI_COMMERCE_ITEM_TYPE },
    }).catch(() => undefined),
    writeAiCommerceAudit({
      userId: params.userId,
      action: AI_AUDIT.PRODUCT_PURCHASED,
      orderId: order.id,
      metadata: { orderNumber: order.orderNumber, status: "PENDING" },
    }),
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

export { ECCOPONTOS_DIGITAL_AI_POLICY };

