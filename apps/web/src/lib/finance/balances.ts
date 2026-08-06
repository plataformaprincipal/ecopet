import "server-only";

import { prisma } from "@/lib/prisma";
import { fromCents } from "./money";

export type PartnerBalanceSummary = {
  partnerId: string;
  currency: string;
  pendingCents: number;
  blockedCents: number;
  availableCents: number;
  inPayoutCents: number;
  paidCents: number;
  reversedCents: number;
  negativeCents: number;
  netPayableCents: number;
  asFloats: {
    pending: number;
    blocked: number;
    available: number;
    inPayout: number;
    paid: number;
    reversed: number;
    negative: number;
  };
  disclaimer: {
    estimatedIsNotAvailable: string;
    availableIsNotPaid: string;
  };
};

/**
 * Saldos derivados do ledger (PARTNER_PAYABLE + débitos + payouts).
 */
export async function getPartnerBalances(partnerId: string, currency = "BRL"): Promise<PartnerBalanceSummary> {
  const [payables, debits, payouts, reserves] = await Promise.all([
    prisma.financialLedgerEntry.findMany({
      where: {
        partnerId,
        currency,
        entryType: "PARTNER_PAYABLE",
        status: { notIn: ["CANCELLED", "REVERSED"] },
      },
    }),
    prisma.financialLedgerEntry.findMany({
      where: {
        partnerId,
        currency,
        entryType: {
          in: ["REVERSAL_PARTNER_PAYABLE", "REFUND", "CHARGEBACK", "ADJUSTMENT"],
        },
        status: { notIn: ["CANCELLED"] },
      },
    }),
    prisma.partnerPayout.findMany({
      where: { partnerId, currency, status: { notIn: ["CANCELLED"] } },
    }),
    prisma.financialLedgerEntry.findMany({
      where: {
        partnerId,
        currency,
        entryType: "RESERVE_HOLD",
        status: { in: ["BLOCKED", "POSTED"] },
      },
    }),
  ]);

  let blockedCents = 0;
  let availableCents = 0;
  let pendingCents = 0;
  let netPayableCents = 0;

  for (const e of payables) {
    const amt = e.direction === "CREDIT" ? e.amountCents : -e.amountCents;
    netPayableCents += amt;
    if (e.payoutId || e.status === "SETTLED") continue;
    if (e.status === "BLOCKED" || e.status === "PENDING") blockedCents += Math.max(0, amt);
    else if (e.status === "AVAILABLE") availableCents += amt;
    else if (e.status === "POSTED") pendingCents += amt;
  }

  for (const r of reserves) {
    if (r.direction === "CREDIT") blockedCents += r.amountCents;
  }

  for (const d of debits) {
    const delta = d.direction === "CREDIT" ? d.amountCents : -d.amountCents;
    netPayableCents += delta;
    availableCents += delta;
  }

  let inPayoutCents = 0;
  let paidCents = 0;
  let reversedCents = 0;
  for (const p of payouts) {
    if (p.status === "PAID") paidCents += p.amountCents;
    else if (p.status === "REVERSED") reversedCents += p.amountCents;
    else if (["PENDING", "APPROVED", "PROCESSING"].includes(p.status)) {
      inPayoutCents += p.amountCents;
    }
  }

  let negativeCents = 0;
  if (availableCents < 0) {
    negativeCents = -availableCents;
    availableCents = 0;
  }
  if (netPayableCents < 0) {
    negativeCents = Math.max(negativeCents, -netPayableCents);
  }

  return {
    partnerId,
    currency,
    pendingCents: Math.max(0, pendingCents),
    blockedCents: Math.max(0, blockedCents),
    availableCents: Math.max(0, availableCents),
    inPayoutCents,
    paidCents,
    reversedCents,
    negativeCents,
    netPayableCents,
    asFloats: {
      pending: fromCents(Math.max(0, pendingCents)),
      blocked: fromCents(Math.max(0, blockedCents)),
      available: fromCents(Math.max(0, availableCents)),
      inPayout: fromCents(inPayoutCents),
      paid: fromCents(paidCents),
      reversed: fromCents(reversedCents),
      negative: fromCents(negativeCents),
    },
    disclaimer: {
      estimatedIsNotAvailable:
        "Valor estimado / bloqueado não significa dinheiro disponível para repasse.",
      availableIsNotPaid:
        "Saldo disponível não significa repasse concluído.",
    },
  };
}

/** Centavos disponíveis para inclusão em repasse (somente PARTNER_PAYABLE AVAILABLE sem payout). */
export async function listAvailablePayableEntries(partnerId: string, currency = "BRL") {
  return prisma.financialLedgerEntry.findMany({
    where: {
      partnerId,
      currency,
      entryType: "PARTNER_PAYABLE",
      status: "AVAILABLE",
      payoutId: null,
      direction: "CREDIT",
    },
    orderBy: { occurredAt: "asc" },
  });
}
