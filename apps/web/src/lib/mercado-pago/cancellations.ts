import "server-only";

import { prisma } from "@/lib/prisma";
import {
  cancelMercadoPagoLegacyPayment,
  newIdempotencyKey,
} from "@/lib/mercado-pago/client";
import { applyInternalPaymentStatus } from "@/lib/mercado-pago/apply-payment-status";
import { writeAuditLog } from "@/lib/audit-log";

const PENDING = new Set(["CREATED", "PENDING", "PROCESSING", "ACTION_REQUIRED"]);

/**
 * Cancela cobrança pendente no MP (Payments API) + atualiza EcoPet.
 * Pagamento APPROVED deve usar estorno, não cancelamento.
 */
export async function cancelPendingMercadoPagoPayment(input: {
  paymentId: string;
  actorId: string;
  reason?: string;
}): Promise<{ ok: boolean; code: string; message: string }> {
  const payment = await prisma.payment.findUnique({ where: { id: input.paymentId } });
  if (!payment) return { ok: false, code: "NOT_FOUND", message: "Pagamento não encontrado." };
  if (payment.status === "APPROVED" || payment.status === "PARTIALLY_REFUNDED") {
    return {
      ok: false,
      code: "USE_REFUND",
      message: "Pagamento aprovado — use estorno, não cancelamento.",
    };
  }
  if (!PENDING.has(payment.status)) {
    return { ok: false, code: "NOT_CANCELLABLE", message: "Status não permite cancelamento." };
  }

  if (payment.providerPaymentId) {
    const remote = await cancelMercadoPagoLegacyPayment(
      payment.providerPaymentId,
      newIdempotencyKey()
    );
    if (!remote.ok && remote.code !== "MP_VALIDATION") {
      // Continua cancelamento local se MP já cancelou / não aplicável
      if (remote.status !== 400 && remote.status !== 404) {
        return { ok: false, code: remote.code, message: remote.message };
      }
    }
  }

  await applyInternalPaymentStatus({
    paymentId: payment.id,
    internalStatus: "CANCELLED",
    statusDetail: input.reason?.slice(0, 200) ?? "cancelled_by_ecopet",
    source: "api",
  });

  void writeAuditLog({
    actorId: input.actorId,
    action: "UPDATE",
    module: "payments.cancel",
    resource: "Payment",
    resourceId: payment.id,
    observation: input.reason?.slice(0, 200),
  }).catch(() => undefined);

  return { ok: true, code: "OK", message: "Pagamento cancelado." };
}
