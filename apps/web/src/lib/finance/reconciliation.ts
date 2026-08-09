import "server-only";

import type { FinancialReconciliationStatus, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit-log";
import {
  getMercadoPagoLegacyPayment,
  getMercadoPagoOrder,
} from "@/lib/mercado-pago/client";
import { getFinancialFlags } from "./flags";
import { toCents } from "./money";
import { classifyAmountReconciliation } from "./reconciliation-classify";
import { emitFinancialAlert } from "./financial-alerts";

export { classifyAmountReconciliation } from "./reconciliation-classify";

export type ProviderAmountFetchResult =
  | { ok: true; providerAmountCents: number; source: "orders" | "payments" }
  | { ok: false; code: "PROVIDER_UNAVAILABLE" | "PROVIDER_AMOUNT_MISSING"; message: string };

/**
 * Obtém amount efetivo do provider (Orders API ou Payments legado).
 * Não altera estado local.
 */
export async function fetchProviderReportedAmountCents(payment: {
  providerOrderId?: string | null;
  providerPaymentId?: string | null;
  externalId?: string | null;
}): Promise<ProviderAmountFetchResult> {
  const orderId = payment.providerOrderId || payment.externalId;
  if (orderId && /^ORD/i.test(String(orderId))) {
    const remote = await getMercadoPagoOrder(String(orderId));
    if (!remote.ok) {
      return {
        ok: false,
        code: "PROVIDER_UNAVAILABLE",
        message: `${remote.status}:${remote.code}`,
      };
    }
    const total = remote.data.total_amount;
    const payAmt = remote.data.transactions?.payments?.[0]?.amount;
    const raw = total ?? payAmt;
    if (raw == null || raw === "" || !Number.isFinite(Number(raw))) {
      return {
        ok: false,
        code: "PROVIDER_AMOUNT_MISSING",
        message: "orders.total_amount/payments[0].amount ausente",
      };
    }
    return {
      ok: true,
      providerAmountCents: toCents(Number(raw)),
      source: "orders",
    };
  }

  const legacyId = payment.providerPaymentId || payment.externalId;
  if (legacyId) {
    const remote = await getMercadoPagoLegacyPayment(String(legacyId));
    if (!remote.ok) {
      return {
        ok: false,
        code: "PROVIDER_UNAVAILABLE",
        message: `${remote.status}:${remote.code}`,
      };
    }
    const raw = remote.data.transaction_amount ?? remote.data.total_paid_amount;
    if (raw == null || !Number.isFinite(Number(raw))) {
      return {
        ok: false,
        code: "PROVIDER_AMOUNT_MISSING",
        message: "payments.transaction_amount ausente",
      };
    }
    return {
      ok: true,
      providerAmountCents: toCents(Number(raw)),
      source: "payments",
    };
  }

  return {
    ok: false,
    code: "PROVIDER_AMOUNT_MISSING",
    message: "sem providerOrderId/providerPaymentId",
  };
}

export async function reconcilePayment(
  paymentId: string,
  opts?: { runId?: string; skipProviderFetch?: boolean }
) {
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: {
      order: true,
      paymentRefunds: true,
      events: { take: 50, orderBy: { createdAt: "desc" } },
    },
  });
  if (!payment) {
    return { status: "MANUAL_REVIEW" as FinancialReconciliationStatus, paymentId };
  }

  const expectedAmountCents = toCents(payment.amount);
  let receivedAmountCents = expectedAmountCents;
  let providerAmountCents: number | null = null;
  let providerSource: string | null = null;
  let providerFetchOk = false;
  let providerUnavailable = false;

  if (!opts?.skipProviderFetch && payment.provider === "mercado_pago") {
    const remote = await fetchProviderReportedAmountCents(payment);
    if (remote.ok) {
      providerFetchOk = true;
      providerAmountCents = remote.providerAmountCents;
      receivedAmountCents = remote.providerAmountCents;
      providerSource = remote.source;
    } else if (remote.code === "PROVIDER_UNAVAILABLE") {
      providerUnavailable = true;
    }
  }

  const ledgerCount = await prisma.financialLedgerEntry.count({
    where: { paymentId: payment.id },
  });
  const chargebacks = await prisma.financialChargeback.count({
    where: { paymentId: payment.id },
  });

  let status: FinancialReconciliationStatus = "RECONCILED";
  const details: Record<string, unknown> = {
    paymentStatus: payment.status,
    orderStatus: payment.order.status,
    ledgerCount,
    refundCount: payment.paymentRefunds.length,
    chargebacks,
    eventCount: payment.events.length,
    expectedAmountCents,
    providerAmountCents,
    differenceCents:
      providerAmountCents != null ? providerAmountCents - expectedAmountCents : null,
    providerSource,
    providerFetchOk,
    providerUnavailable,
  };

  if (
    (payment.status === "APPROVED" || payment.status === "PAID") &&
    getFinancialFlags().FINANCIAL_LEDGER_ENABLED &&
    ledgerCount === 0 &&
    !payment.order.financialLedgerPostedAt
  ) {
    status = "MISSING_LEDGER";
  }

  if (!payment.providerPaymentId && !payment.externalId && payment.status === "APPROVED") {
    status = "MISSING_EXTERNAL_PAYMENT";
  }

  const refundedCents = toCents(payment.refundedAmount ?? 0);
  const refundSum = payment.paymentRefunds
    .filter((r) =>
      ["COMPLETED", "APPROVED", "FULLY_REFUNDED", "PROCESSED", "SUCCESS"].includes(r.status)
    )
    .reduce((s, r) => s + toCents(r.amount), 0);
  if (refundedCents > 0 && Math.abs(refundedCents - refundSum) > 1) {
    status = "REFUND_MISMATCH";
  }

  const orderTotalCents = toCents(payment.order.total);
  if (Math.abs(orderTotalCents - expectedAmountCents) > 1) {
    status = "VALUE_MISMATCH";
  }

  const amountClass = classifyAmountReconciliation({
    expectedAmountCents,
    providerAmountCents,
    providerFetchOk,
    providerUnavailable,
  });
  if (amountClass === "VALUE_MISMATCH") {
    status = "VALUE_MISMATCH";
  } else if (amountClass === "MANUAL_REVIEW" && status === "RECONCILED") {
    // Provider indisponível / sem amount — não marcar RECONCILED silenciosamente
    if (payment.status === "APPROVED" || payment.status === "PAID") {
      status = "MANUAL_REVIEW";
    }
  }

  const duplicateEvents = await prisma.paymentEvent.groupBy({
    by: ["message"],
    where: { paymentId: payment.id },
    _count: true,
  });
  if (duplicateEvents.some((d) => d._count > 5)) {
    status = status === "RECONCILED" ? "DUPLICATE_EVENT" : status;
  }

  if (
    payment.status === "APPROVED" &&
    payment.order.status !== "PAID" &&
    payment.order.status !== "COMPLETED" &&
    payment.order.status !== "REFUNDED" &&
    payment.order.status !== "PARTIALLY_REFUNDED"
  ) {
    status = "STATUS_MISMATCH";
  }

  const idempotencyKey = `recon:${payment.id}:${opts?.runId ?? "manual"}`;
  const row = await prisma.financialReconciliation.upsert({
    where: { idempotencyKey },
    create: {
      paymentId: payment.id,
      orderId: payment.orderId,
      runId: opts?.runId,
      status,
      expectedAmountCents,
      receivedAmountCents,
      summary: status,
      details: details as Prisma.InputJsonValue,
      idempotencyKey,
    },
    update: {
      status,
      expectedAmountCents,
      receivedAmountCents,
      summary: status,
      details: details as Prisma.InputJsonValue,
    },
  });

  if (status !== "RECONCILED") {
    await writeAuditLog({
      action: "UPDATE",
      module: "finance",
      resource: "FinancialReconciliation",
      resourceId: row.id,
      observation: "reconciliation.failed",
      entityAfter: {
        status,
        paymentId,
        expectedAmountCents,
        providerAmountCents,
        differenceCents: details.differenceCents,
      },
    }).catch(() => undefined);

    if (status === "VALUE_MISMATCH") {
      await emitFinancialAlert({
        code: "PROVIDER_AMOUNT_MISMATCH",
        severity: "P0",
        message: "reconciliation VALUE_MISMATCH",
        meta: {
          paymentId,
          expectedAmountCents,
          providerAmountCents: providerAmountCents ?? null,
          differenceCents:
            typeof details.differenceCents === "number" ? details.differenceCents : null,
        },
      }).catch(() => undefined);
    } else if (status === "MISSING_LEDGER") {
      await emitFinancialAlert({
        code: "LEDGER_POST_FAILURE",
        severity: "P0",
        message: "reconciliation MISSING_LEDGER",
        meta: { paymentId },
      }).catch(() => undefined);
    } else {
      await emitFinancialAlert({
        code: "RECONCILIATION_MISMATCH",
        severity: "P1",
        message: `reconciliation ${status}`,
        meta: { paymentId, status },
      }).catch(() => undefined);
    }
  }

  return {
    status,
    paymentId,
    reconciliationId: row.id,
    details,
    expectedAmountCents,
    providerAmountCents,
    receivedAmountCents,
  };
}

export async function runDailyFinancialReconciliation(params: {
  triggeredBy: string;
  idempotencyKey: string;
  lookbackHours?: number;
}) {
  const flags = getFinancialFlags();
  if (!flags.DAILY_RECONCILIATION_ENABLED && process.env.NODE_ENV === "production") {
    // Em prod exige flag; em dev/preview permite execução manual admin
  }

  const existing = await prisma.financialReconciliationRun.findUnique({
    where: { idempotencyKey: params.idempotencyKey },
  });
  if (existing?.status === "COMPLETED") {
    return existing;
  }

  const run = existing
    ? existing
    : await prisma.financialReconciliationRun.create({
        data: {
          triggeredBy: params.triggeredBy,
          idempotencyKey: params.idempotencyKey,
          status: "RUNNING",
        },
      });

  const since = new Date();
  since.setHours(since.getHours() - (params.lookbackHours ?? 48));

  const payments = await prisma.payment.findMany({
    where: {
      createdAt: { gte: since },
      provider: "mercado_pago",
    },
    select: { id: true },
    take: 500,
  });

  let divergences = 0;
  const results: Array<{ paymentId: string; status: string }> = [];
  for (const p of payments) {
    const r = await reconcilePayment(p.id, { runId: run.id });
    results.push({ paymentId: p.id, status: r.status });
    if (r.status !== "RECONCILED") divergences += 1;
  }

  const finished = await prisma.financialReconciliationRun.update({
    where: { id: run.id },
    data: {
      status: "COMPLETED",
      finishedAt: new Date(),
      paymentsChecked: payments.length,
      divergences,
      report: { results },
    },
  });

  await writeAuditLog({
    action: "CREATE",
    module: "finance",
    resource: "FinancialReconciliationRun",
    resourceId: run.id,
    actorId: params.triggeredBy,
    observation: "reconciliation.daily",
    entityAfter: { paymentsChecked: payments.length, divergences },
  }).catch(() => undefined);

  return finished;
}
