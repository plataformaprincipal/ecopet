import "server-only";

import { DeliveryMethod, PaymentMethod, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getOrCreateCart } from "@/lib/cart/cart-service";
import { PricingError, serverQuoteProduct, quoteToOrderFloats } from "@/lib/pricing/service";
import {
  buildCheckoutTestNotes,
  CHECKOUT_TEST_NOTE_PREFIX,
  isCheckoutTestOrderNotes,
} from "@/lib/mercado-pago/test-credentials";

const TEST_ADDRESS = {
  street: "Checkout TEST EccoPet",
  number: "0",
  district: "Sé",
  city: "São Paulo",
  state: "SP",
  zipCode: "01001000",
  phone: "11999999999",
};

const REUSE_WINDOW_MS = 2 * 60 * 60 * 1000;

/**
 * Cria Order TEST a partir do carrinho atual.
 * Não baixa estoque, não consome cupom, não notifica, não posta ledger.
 */
export async function checkoutTestFromCart(params: {
  userId: string;
  idempotencyKey?: string | null;
}) {
  if (params.idempotencyKey) {
    const existing = await prisma.order.findUnique({
      where: { idempotencyKey: params.idempotencyKey },
      include: { items: true, payments: true },
    });
    if (existing) {
      if (existing.userId !== params.userId) throw new Error("IDEMPOTENCY_CONFLICT");
      if (!isCheckoutTestOrderNotes(existing.deliveryNotes)) throw new Error("IDEMPOTENCY_CONFLICT");
      return existing;
    }
  }

  const reusable = await prisma.order.findFirst({
    where: {
      userId: params.userId,
      deliveryNotes: { startsWith: CHECKOUT_TEST_NOTE_PREFIX },
      status: { in: ["PENDING", "PENDING_CONFIRMATION"] },
      createdAt: { gte: new Date(Date.now() - REUSE_WINDOW_MS) },
      payments: { none: { status: "APPROVED" } },
    },
    orderBy: { createdAt: "desc" },
    include: { items: true, payments: true },
  });
  if (reusable) return reusable;

  const cart = await getOrCreateCart(params.userId);
  const physicalItems = cart.items.filter((i) => i.itemType !== "DIGITAL_AI" && i.productId);
  if (!physicalItems.length) throw new Error("CART_EMPTY");

  const productIds = physicalItems.map((i) => i.productId!).filter(Boolean);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds }, deletedAt: null },
  });
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
    if (item.quantity <= 0) throw new Error("INVALID_QUANTITY");
    if (product.price < 0) throw new Error("INVALID_UNIT_PRICE");
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
      partnerVerified: true,
      partnerId,
      charging: false,
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
      "Motor de pricing indisponível. Checkout de teste bloqueado (fail-closed)."
    );
  }
  if (snap.grossAmount <= 0) throw new Error("INVALID_TOTAL");

  const maxNum = (await prisma.order.aggregate({ _max: { orderNumber: true } }))._max.orderNumber ?? 1000;

  return prisma.order.create({
    data: {
      orderNumber: maxNum + 1,
      userId: params.userId,
      partnerId,
      status: "PENDING",
      fulfillmentStatus: "PENDING",
      total: Math.max(0, snap.grossAmount - snap.discountAmount),
      grossAmount: snap.grossAmount,
      discount: snap.discountAmount,
      platformFeeAmount: 0,
      partnerAmount: 0,
      platformPercentage: snap.platformPercentage,
      platformFixedFee: 0,
      gatewayFeeEstimated: 0,
      reserveAmount: 0,
      taxEstimate: 0,
      pricingVersion: snap.pricingVersion,
      pricingSnapshot: engineSnapshot as Prisma.InputJsonValue,
      currency: "BRL",
      idempotencyKey: params.idempotencyKey || null,
      shippingAddress: TEST_ADDRESS,
      deliveryMethod: DeliveryMethod.PICKUP_LOCAL,
      paymentMethod: PaymentMethod.CARD,
      deliveryNotes: buildCheckoutTestNotes("sem baixa de estoque; sem efeito financeiro LIVE"),
      items: {
        create: lines.map((line, idx) => ({
          productId: line.productId,
          itemType: "product",
          name: line.name,
          quantity: line.quantity,
          price: lineQuotes[idx]!.unitPrice,
          grossAmount: lineQuotes[idx]!.grossAmount,
          platformFeeAmount: 0,
          partnerAmount: 0,
          pricingVersion: snap.pricingVersion,
          partnerId,
        })),
      },
      statusHistory: {
        create: {
          status: "PENDING",
          note: "Pedido TEST — Mercado Pago TEST — sem cobrança real, sem baixa de estoque, sem ledger",
        },
      },
    },
    include: { items: true, payments: true },
  });
}
