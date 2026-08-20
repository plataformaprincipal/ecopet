import { z } from "zod";
import { OrderStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiFailure } from "@/lib/api-response";
import { requireClient } from "@/lib/auth/require-auth";
import { assertOrderTransition, InvalidOrderTransitionError } from "@/lib/commerce/order-state-machine";
import { writeAuditLog } from "@/lib/audit-log";
import { humanizeOrderPricing } from "@/lib/finance/metrics";

type RouteContext = { params: Promise<{ orderId: string }> };

export async function GET(_req: Request, context: RouteContext) {
  const { user, error } = await requireClient();
  if (error) return error;
  const { orderId } = await context.params;

  const order = await prisma.order.findFirst({
    where: { id: orderId, userId: user!.id },
    include: {
      items: true,
      statusHistory: { orderBy: { createdAt: "asc" } },
      fulfillments: true,
      payments: { orderBy: { createdAt: "desc" }, take: 10 },
    },
  });

  if (!order) return apiFailure("NOT_FOUND", "Pedido não encontrado.", 404);

  const { toClientPaymentView } = await import("@/lib/mercado-pago/payment-views");
  const { payments, pricingSnapshot: _rawSnapshot, ...rest } = order;
  void _rawSnapshot;
  return apiSuccess({
    order: {
      ...rest,
      payments: payments.map(toClientPaymentView),
      pricing: humanizeOrderPricing(order),
      pricingVersion: order.pricingVersion,
    },
  });
}

const patchSchema = z.object({
  action: z.literal("confirm_pickup"),
  qrCode: z.string().optional(),
});

/** Cliente confirma retirada (operacional — não altera status financeiro). */
export async function PATCH(request: Request, context: RouteContext) {
  const { user, error } = await requireClient();
  if (error) return error;
  const { orderId } = await context.params;

  const parsed = patchSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return apiFailure("VALIDATION", "Ação inválida.", 400);
  }

  const order = await prisma.order.findFirst({
    where: { id: orderId, userId: user!.id },
  });
  if (!order) return apiFailure("NOT_FOUND", "Pedido não encontrado.", 404);

  if (
    order.pickupQrCode &&
    parsed.data.qrCode &&
    order.pickupQrCode !== parsed.data.qrCode
  ) {
    return apiFailure("VALIDATION", "QR Code inválido.", 400);
  }

  const next = OrderStatus.PICKED_UP;
  try {
    assertOrderTransition(order.status, next, "client");
  } catch (e) {
    if (e instanceof InvalidOrderTransitionError) {
      return apiFailure("VALIDATION", `Não é possível confirmar retirada a partir de ${order.status}.`, 400);
    }
    throw e;
  }

  const updated = await prisma.order.update({
    where: { id: orderId },
    data: {
      status: next,
      fulfillmentStatus: next,
      statusHistory: {
        create: { status: next, note: "Retirada confirmada pelo cliente" },
      },
    },
    include: { items: true, statusHistory: { orderBy: { createdAt: "asc" } } },
  });

  await writeAuditLog({
    actorId: user!.id,
    action: "UPDATE",
    module: "commerce.client.pickup",
    resource: "Order",
    resourceId: orderId,
    entityBefore: { status: order.status },
    entityAfter: { status: next },
  }).catch(() => undefined);

  return apiSuccess({ order: updated });
}
