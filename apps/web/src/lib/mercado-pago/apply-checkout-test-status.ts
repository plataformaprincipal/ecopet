import "server-only";
import { prisma } from "@/lib/prisma";
import { checkoutTestAmount } from "./checkout-test-isolation";
import type { InternalPaymentStatus } from "./status";

/** TEST status is deliberately not a LIVE APPROVED/PAID status. No Order status,
 * inventory, rewards, ledger, commission, email or payout side effects.
 */
export async function applyCheckoutTestPaymentStatus(params: {
  paymentId: string;
  internalStatus: InternalPaymentStatus;
  statusDetail?: string | null;
  providerOrderId?: string | null;
  providerPaymentId?: string | null;
  source: "api" | "webhook" | "poll";
}): Promise<{ changed: boolean }> {
  const payment = await prisma.payment.findUnique({ where: { id: params.paymentId }, include: { order: true } });
  const meta = payment?.metadata as Record<string, unknown> | null;
  if (!payment || payment.environment !== "test" || meta?.checkoutTest !== true || !checkoutTestAmount(payment.order)) return { changed: false };
  const status = `TEST_${params.internalStatus}`;
  if (payment.status === status || (payment.status === "TEST_APPROVED" && !params.internalStatus.includes("REFUND"))) return { changed: false };
  await prisma.payment.update({
    where: { id: payment.id },
    data: {
      status, statusDetail: params.statusDetail ?? null,
      ...(params.providerOrderId ? { providerOrderId: params.providerOrderId, externalId: params.providerOrderId } : {}),
      ...(params.providerPaymentId ? { providerPaymentId: params.providerPaymentId } : {}),
    },
  });
  return { changed: true };
}
