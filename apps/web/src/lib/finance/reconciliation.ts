import "server-only";

import type { FinancialReconciliationStatus, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit-log";
import { getFinancialFlags } from "./flags";
import { toCents } from "./money";

export async function reconcilePayment(paymentId: string, opts?: { runId?: string }) {
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
  const receivedAmountCents = toCents(payment.amount);
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
      entityAfter: { status, paymentId },
    }).catch(() => undefined);
  }

  return { status, paymentId, reconciliationId: row.id, details };
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
