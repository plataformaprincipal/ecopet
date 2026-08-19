import "server-only";

import { AppointmentStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  earnPointsForOrder,
  earnPointsForService,
  reversePointsForOrder,
  reversePointsForService,
} from "./service";
import { getOrCreateLoyaltyPolicy, pointsForOrderAmount, pointsForServiceAmount, resolveEarnMultiplier } from "./policy";
import { expiresAtFromPolicy, isOrderEligibleForEarn, isServiceEligibleForEarn, refundEarnFraction } from "./rules";

async function safeRun(label: string, fn: () => Promise<unknown>) {
  try {
    await fn();
  } catch (e) {
    console.error(`[loyalty:${label}]`, e);
  }
}

/** Observa pedido elegível (pago/concluído). Não altera Mercado Pago. */
export async function onOrderStatusForRewards(orderId: string) {
  await safeRun("order", async () => {
    const policy = await getOrCreateLoyaltyPolicy();
    if (!policy.enabled) return;
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { id: true, userId: true, status: true, total: true, orderNumber: true },
    });
    if (!order) return;

    if (isOrderEligibleForEarn(order.status)) {
      const multiplier = await resolveEarnMultiplier({ userId: order.userId, sourceType: "ORDER" });
      const points = pointsForOrderAmount(order.total, policy, multiplier);
      if (points <= 0) return;
      await earnPointsForOrder({
        userId: order.userId,
        orderId: order.id,
        points,
        description: `Compra #${order.orderNumber}`,
        expiresAt: expiresAtFromPolicy(policy.expirationDays),
      });
    }
  });
}

export async function onOrderRefundedForRewards(params: {
  orderId: string;
  refundId?: string;
  refundAmount?: number;
  fullRefund?: boolean;
}) {
  await safeRun("order-refund", async () => {
    const policy = await getOrCreateLoyaltyPolicy();
    if (!policy.enabled) return;
    const order = await prisma.order.findUnique({
      where: { id: params.orderId },
      select: { id: true, userId: true, total: true, orderNumber: true },
    });
    if (!order) return;
    const fraction = refundEarnFraction({
      fullRefund: params.fullRefund,
      refundAmount: params.refundAmount,
      orderTotal: order.total,
    });
    if (fraction == null) return;
    await reversePointsForOrder({
      userId: order.userId,
      orderId: order.id,
      refundId: params.refundId,
      fraction,
      description: `Estorno da compra #${order.orderNumber}`,
    });
  });
}

export async function onAppointmentStatusForRewards(appointmentId: string) {
  await safeRun("service", async () => {
    const policy = await getOrCreateLoyaltyPolicy();
    if (!policy.enabled) return;
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      select: {
        id: true,
        userId: true,
        status: true,
        service: { select: { price: true, name: true, category: true } },
      },
    });
    if (!appointment) return;

    if (isServiceEligibleForEarn(appointment.status)) {
      const amount = appointment.service?.price ?? 0;
      const multiplier = await resolveEarnMultiplier({
        userId: appointment.userId,
        sourceType: "SERVICE",
        category: appointment.service?.category ?? null,
      });
      const points = pointsForServiceAmount(amount, policy, multiplier);
      if (points <= 0) return;
      await earnPointsForService({
        userId: appointment.userId,
        appointmentId: appointment.id,
        points,
        description: appointment.service?.name ? `Serviço: ${appointment.service.name}` : "Serviço concluído",
        expiresAt: expiresAtFromPolicy(policy.expirationDays),
      });
      return;
    }

    if (appointment.status === AppointmentStatus.CANCELLED || appointment.status === AppointmentStatus.REJECTED) {
      await reversePointsForService({
        userId: appointment.userId,
        appointmentId: appointment.id,
        description: "Serviço cancelado",
      });
    }
  });
}
