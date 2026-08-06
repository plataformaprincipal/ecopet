import "server-only";

import { prisma } from "@/lib/prisma";
import { fromCents } from "./money";

/**
 * Relatório mínimo — NÃO mistura GMV com receita EccoPet.
 */
export async function buildFinancialReport(params?: { from?: Date; to?: Date }) {
  const from = params?.from;
  const to = params?.to;
  const paymentWhere = {
    status: { in: ["APPROVED", "PAID", "REFUNDED", "PARTIALLY_REFUNDED"] },
    ...(from || to
      ? { createdAt: { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) } }
      : {}),
  };

  const payments = await prisma.payment.findMany({
    where: paymentWhere,
    select: { amount: true, refundedAmount: true, status: true, id: true },
  });

  const gmvCents = payments.reduce((s, p) => s + Math.round(p.amount * 100), 0);

  const commission = await prisma.financialLedgerEntry.aggregate({
    where: {
      entryType: "PLATFORM_COMMISSION",
      direction: "CREDIT",
      ...(from || to
        ? { createdAt: { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) } }
        : {}),
    },
    _sum: { amountCents: true },
  });
  const fixed = await prisma.financialLedgerEntry.aggregate({
    where: { entryType: "PLATFORM_FIXED_FEE", direction: "CREDIT" },
    _sum: { amountCents: true },
  });
  const gateway = await prisma.financialLedgerEntry.aggregate({
    where: { entryType: { in: ["GATEWAY_FEE_ESTIMATED", "GATEWAY_FEE_ACTUAL", "GATEWAY_FEE_ADJUSTMENT"] } },
    _sum: { amountCents: true },
  });
  const partner = await prisma.financialLedgerEntry.aggregate({
    where: { entryType: "PARTNER_PAYABLE", direction: "CREDIT" },
    _sum: { amountCents: true },
  });
  const reserves = await prisma.financialReserve.aggregate({
    where: { status: "HELD" },
    _sum: { amountCents: true },
  });
  const refunds = await prisma.financialLedgerEntry.aggregate({
    where: { entryType: "REFUND" },
    _sum: { amountCents: true },
  });
  const chargebacks = await prisma.financialLedgerEntry.aggregate({
    where: { entryType: "CHARGEBACK", direction: "DEBIT" },
    _sum: { amountCents: true },
  });
  const payoutsPaid = await prisma.partnerPayout.aggregate({
    where: { status: "PAID" },
    _sum: { amountCents: true },
  });
  const divergences = await prisma.financialReconciliation.count({
    where: { status: { not: "RECONCILED" } },
  });

  const receitaBruta =
    (commission._sum.amountCents ?? 0) + (fixed._sum.amountCents ?? 0);
  const taxasGateway = gateway._sum.amountCents ?? 0;
  const receitaLiquidaEstimada = Math.max(0, receitaBruta - taxasGateway);

  return {
    gmv: fromCents(gmvCents),
    gmvCents,
    receitaBrutaEccopet: fromCents(receitaBruta),
    receitaLiquidaEstimada: fromCents(receitaLiquidaEstimada),
    taxasGateway: fromCents(taxasGateway),
    valoresParceiros: fromCents(partner._sum.amountCents ?? 0),
    reservasHeld: fromCents(reserves._sum.amountCents ?? 0),
    reembolsos: fromCents(refunds._sum.amountCents ?? 0),
    chargebacks: fromCents(chargebacks._sum.amountCents ?? 0),
    repassesPagos: fromCents(payoutsPaid._sum.amountCents ?? 0),
    divergencias: divergences,
    notes: {
      gmvIsNotRevenue: "GMV é valor pago pelo cliente, não receita EccoPet.",
      partnerIsLiability: "Valores de parceiros são obrigação, não receita.",
      taxIsEstimate: "Impostos estimados não entram como obrigação fiscal definitiva.",
    },
  };
}
