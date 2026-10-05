import "server-only";
import { Prisma, type DeliveryMethod, type PaymentMethod } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { CHECKOUT_TEST_NOTE_PREFIX, isMercadoPagoTestCheckoutConfigured } from "./test-credentials";
import { checkoutTestAmount, checkoutTestPublicOrder } from "./checkout-test-isolation";

/** Existing Order model only. Zero LIVE monetary fields, no fulfillment associations.
 * Sandbox value lives exclusively in the immutable TEST snapshot.
 */
export async function checkoutTestFromCart(params: {
  userId: string;
  deliveryMethod: DeliveryMethod;
  paymentMethod?: PaymentMethod;
  phone: string;
  notes: string;
  address: Prisma.InputJsonValue;
}) {
  if (!isMercadoPagoTestCheckoutConfigured()) throw new Error("MP_TEST_NOT_CONFIGURED");
  const idempotencyKey = `checkout-test:${params.userId}`;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      return await prisma.$transaction(async (tx) => {
        // Serialize TEST creation across instances. LIVE checkout does not take this lock.
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(741903, 1)`;
        const existing = await tx.order.findFirst({
          where: { userId: params.userId, deliveryNotes: { startsWith: CHECKOUT_TEST_NOTE_PREFIX } },
          orderBy: { createdAt: "desc" }, include: { items: true, payments: true },
        });
        if (existing) {
          // Never create another order, including after refresh or completion.
          if (!checkoutTestAmount(existing)) throw new Error("LEGACY_TEST_ORDER");
          return checkoutTestPublicOrder(existing);
        }
        const cart = await tx.cart.findUnique({
          where: { userId: params.userId }, include: { items: { include: { product: true } } },
        });
        const items = cart?.items.filter((i) => i.itemType !== "DIGITAL_AI" && i.itemType !== "QUOTE" && i.product) ?? [];
        if (!items.length) throw new Error("CART_EMPTY");
        const lines = items.map((i) => {
          const product = i.product!;
          if (product.status !== "ACTIVE" || product.approvalStatus !== "APPROVED" || product.deletedAt) throw new Error("PRODUCT_INACTIVE");
          if (!Number.isSafeInteger(i.quantity) || i.quantity < 1 || i.quantity > 100) throw new Error("INVALID_QUANTITY");
          if (!Number.isFinite(product.price) || product.price <= 0) throw new Error("INVALID_UNIT_PRICE");
          return { name: `[TEST] ${product.name}`, quantity: i.quantity, price: product.price };
        });
        const testAmount = Math.round(lines.reduce((sum, l) => sum + l.quantity * l.price, 0) * 100) / 100;
        if (!(testAmount > 0) || testAmount > 10000) throw new Error("INVALID_TOTAL");
        const max = (await tx.order.aggregate({ _max: { orderNumber: true } }))._max.orderNumber ?? 1000;
        const order = await tx.order.create({
          data: {
            idempotencyKey, userId: params.userId, orderNumber: max + 1,
            total: 0, grossAmount: 0, platformFeeAmount: 0, partnerAmount: 0,
            status: "PENDING", fulfillmentStatus: "PENDING", fulfillmentBlocked: true,
            pricingVersion: "checkout-test-isolated-v2",
            pricingSnapshot: { checkoutTest: true, isolated: true, testAmount },
            deliveryNotes: params.notes, deliveryMethod: params.deliveryMethod,
            paymentMethod: params.paymentMethod ?? "CARD",
            shippingAddress: { ...(params.address as Record<string, unknown>), phone: params.phone },
            // No productId/partnerId/quoteId: cancellation cannot restore real stock,
            // fulfillment, commission, quote conversion and seller payouts cannot run.
            items: { create: lines.map((l) => ({ ...l, price: 0, itemType: "checkout-test", metadata: { testUnitPrice: l.price, checkoutTest: true } })) },
            statusHistory: { create: { status: "PENDING", note: "AMBIENTE DE TESTE — NENHUMA COBRANÇA REAL" } },
          }, include: { items: true, payments: true },
        });
        // Do not consume cart, coupons, inventory or create commercial notifications.
        return checkoutTestPublicOrder(order);
      });
    } catch (error) {
      // LIVE creation also uses max+1: safely retry collisions, never duplicate user TEST.
      if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== "P2002" || attempt === 2) throw error;
    }
  }
  throw new Error("IDEMPOTENCY_CONFLICT");
}
