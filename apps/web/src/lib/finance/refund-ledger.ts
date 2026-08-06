import "server-only";

import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit-log";
import { ensurePartnerAccounts, ensurePlatformAccounts, getAccount } from "./accounts";
import { getFinancialFlags } from "./flags";
import { toCents } from "./money";
import { validateOrderFinancialSnapshot } from "./allocation";

/**
 * Política provisória de reembolso (explícita):
 * - Reverte PARTNER_PAYABLE proporcionalmente
 * - Reverte comissão e taxa fixa proporcionalmente
 * - Consome reserva se necessário
 * - Taxa gateway não devolvida: custo da PLATAFORMA (GATEWAY_FEE_ADJUSTMENT crédito parcial = 0 nesta fase)
 * - Após repasse: gera débito (saldo negativo possível)
 */
export async function postLedgerForRefund(params: {
  paymentId: string;
  refundAmount: number;
  paymentRefundId: string;
  fullRefund: boolean;
}): Promise<{ ok: boolean; code?: string; entryIds?: string[] }> {
  const flags = getFinancialFlags();
  if (!flags.FINANCIAL_LEDGER_ENABLED) {
    return { ok: false, code: "LEDGER_DISABLED" };
  }

  const refundCents = toCents(params.refundAmount);
  if (refundCents <= 0) return { ok: false, code: "INVALID_AMOUNT" };

  const baseKey = `refund:${params.paymentRefundId}`;

  try {
    const entryIds = await prisma.$transaction(async (tx) => {
      const existing = await tx.financialLedgerEntry.findFirst({
        where: { idempotencyKey: `${baseKey}:REFUND` },
      });
      if (existing) {
        const all = await tx.financialLedgerEntry.findMany({
          where: { idempotencyKey: { startsWith: baseKey } },
          select: { id: true },
        });
        return all.map((e) => e.id);
      }

      const payment = await tx.payment.findUnique({
        where: { id: params.paymentId },
        include: { order: true },
      });
      if (!payment?.order) throw new Error("PAYMENT_NOT_FOUND");
      const order = payment.order;
      if (!order.partnerId) throw new Error("ORDER_WITHOUT_PARTNER");

      const allocation = validateOrderFinancialSnapshot(order);
      const ratio = params.fullRefund
        ? 1
        : Math.min(1, refundCents / Math.max(1, allocation.grossAmountCents));

      const partnerRev = Math.round(allocation.partnerPayableCents * ratio);
      const commissionRev = Math.round(allocation.platformPercentageAmountCents * ratio);
      const fixedRev = Math.round(allocation.platformFixedFeeCents * ratio);
      const reserveUse = Math.round(allocation.reserveAmountCents * ratio);

      await ensurePlatformAccounts(tx, order.currency);
      await ensurePartnerAccounts(tx, order.partnerId, order.currency);

      const refundsAcc = await getAccount(tx, "REFUNDS", "platform", order.currency);
      const revenueAcc = await getAccount(tx, "PLATFORM_REVENUE", "platform", order.currency);
      const partnerAcc = await getAccount(tx, "PARTNER_PAYABLE", order.partnerId, order.currency);
      const reserveAcc = await getAccount(tx, "RESERVE", order.partnerId, order.currency);

      const ids: string[] = [];
      const create = async (data: Parameters<typeof tx.financialLedgerEntry.create>[0]["data"]) => {
        const row = await tx.financialLedgerEntry.create({ data });
        ids.push(row.id);
      };

      await create({
        accountId: refundsAcc.id,
        orderId: order.id,
        paymentId: payment.id,
        partnerId: order.partnerId,
        entryType: "REFUND",
        direction: "DEBIT",
        amountCents: refundCents,
        status: "POSTED",
        idempotencyKey: `${baseKey}:REFUND`,
        description: params.fullRefund ? "Reembolso integral" : "Reembolso parcial",
      });

      if (commissionRev > 0) {
        await create({
          accountId: revenueAcc.id,
          orderId: order.id,
          paymentId: payment.id,
          partnerId: order.partnerId,
          entryType: "REVERSAL_PLATFORM_COMMISSION",
          direction: "DEBIT",
          amountCents: commissionRev,
          status: "POSTED",
          idempotencyKey: `${baseKey}:REVERSAL_PLATFORM_COMMISSION`,
          description: "Reversão comissão (política provisória)",
        });
      }
      if (fixedRev > 0) {
        await create({
          accountId: revenueAcc.id,
          orderId: order.id,
          paymentId: payment.id,
          partnerId: order.partnerId,
          entryType: "REVERSAL_PLATFORM_FIXED_FEE",
          direction: "DEBIT",
          amountCents: fixedRev,
          status: "POSTED",
          idempotencyKey: `${baseKey}:REVERSAL_PLATFORM_FIXED_FEE`,
          description: "Reversão taxa fixa (política provisória)",
        });
      }
      if (partnerRev > 0) {
        await create({
          accountId: partnerAcc.id,
          orderId: order.id,
          paymentId: payment.id,
          partnerId: order.partnerId,
          entryType: "REVERSAL_PARTNER_PAYABLE",
          direction: "DEBIT",
          amountCents: partnerRev,
          status: "POSTED",
          idempotencyKey: `${baseKey}:REVERSAL_PARTNER_PAYABLE`,
          description: "Reversão valor parceiro",
        });
      }

      if (flags.RESERVE_ENABLED && reserveUse > 0) {
        const reserve = await tx.financialReserve.findFirst({
          where: { orderId: order.id, status: "HELD" },
        });
        if (reserve) {
          await create({
            accountId: reserveAcc.id,
            orderId: order.id,
            paymentId: payment.id,
            partnerId: order.partnerId,
            entryType: "RESERVE_CONSUMPTION",
            direction: "DEBIT",
            amountCents: Math.min(reserveUse, reserve.amountCents),
            status: "POSTED",
            idempotencyKey: `${baseKey}:RESERVE_CONSUMPTION`,
            description: "Consumo de reserva no reembolso",
          });
          await tx.financialReserve.update({
            where: { id: reserve.id },
            data: {
              status: params.fullRefund ? "CONSUMED" : "HELD",
              consumedAt: params.fullRefund ? new Date() : null,
            },
          });
        }
      }

      // Bloqueia payables ainda BLOCKED/AVAILABLE do pedido
      await tx.financialLedgerEntry.updateMany({
        where: {
          orderId: order.id,
          entryType: "PARTNER_PAYABLE",
          status: { in: ["BLOCKED", "AVAILABLE"] },
          payoutId: null,
        },
        data: { status: params.fullRefund ? "REVERSED" : "BLOCKED" },
      });

      return ids;
    });

    await writeAuditLog({
      action: "CREATE",
      module: "finance",
      resource: "FinancialLedgerEntry",
      resourceId: params.paymentRefundId,
      observation: "refund.confirmed",
      entityAfter: { paymentId: params.paymentId, refundCents },
    }).catch(() => undefined);

    return { ok: true, entryIds };
  } catch (e) {
    const code = e instanceof Error ? e.message : "REFUND_LEDGER_FAILED";
    await writeAuditLog({
      action: "CREATE",
      module: "finance",
      resource: "FinancialLedgerEntry",
      resourceId: params.paymentId,
      observation: `refund.ledger.error:${code}`,
    }).catch(() => undefined);
    return { ok: false, code };
  }
}
