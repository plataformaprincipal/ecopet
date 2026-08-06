import "server-only";

import type { FinancialLedgerEntryType, FinancialLedgerStatus, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit-log";
import { ensurePartnerAccounts, ensurePlatformAccounts, getAccount } from "./accounts";
import { validateOrderFinancialSnapshot, type CommercialAllocation } from "./allocation";
import { getFinancialFlags } from "./flags";
import { toCents } from "./money";

type Tx = Prisma.TransactionClient;

export type PostLedgerResult =
  | { ok: true; alreadyPosted: boolean; entryIds: string[]; allocation: CommercialAllocation }
  | { ok: false; code: string; message: string };

async function createEntry(
  tx: Tx,
  data: {
    accountId: string;
    orderId: string;
    paymentId: string;
    partnerId: string | null;
    entryType: FinancialLedgerEntryType;
    direction: "DEBIT" | "CREDIT";
    amountCents: number;
    status: Extract<FinancialLedgerStatus, "POSTED" | "BLOCKED" | "AVAILABLE">;
    idempotencyKey: string;
    description: string;
    availableAt?: Date | null;
    metadata?: Record<string, unknown>;
  }
) {
  if (data.amountCents <= 0) return null;
  try {
    return await tx.financialLedgerEntry.create({
      data: {
        accountId: data.accountId,
        orderId: data.orderId,
        paymentId: data.paymentId,
        partnerId: data.partnerId,
        entryType: data.entryType,
        direction: data.direction,
        amountCents: data.amountCents,
        status: data.status,
        idempotencyKey: data.idempotencyKey,
        description: data.description,
        availableAt: data.availableAt ?? null,
        metadata: data.metadata as Prisma.InputJsonValue | undefined,
      },
    });
  } catch (e) {
    if (e && typeof e === "object" && "code" in e && (e as { code: string }).code === "P2002") {
      return tx.financialLedgerEntry.findUnique({ where: { idempotencyKey: data.idempotencyKey } });
    }
    throw e;
  }
}

/**
 * Gera lançamentos do pagamento confirmado de forma transacional e idempotente.
 * Usa somente snapshot do pedido (não tabela atual de preços).
 */
export async function postLedgerForApprovedPayment(params: {
  paymentId: string;
  source: string;
  tx?: Tx;
}): Promise<PostLedgerResult> {
  const flags = getFinancialFlags();
  if (!flags.FINANCIAL_LEDGER_ENABLED) {
    return { ok: false, code: "LEDGER_DISABLED", message: "FINANCIAL_LEDGER_ENABLED=false" };
  }

  const run = async (tx: Tx): Promise<PostLedgerResult> => {
    const payment = await tx.payment.findUnique({
      where: { id: params.paymentId },
      include: {
        order: true,
      },
    });
    if (!payment) return { ok: false, code: "PAYMENT_NOT_FOUND", message: "Payment missing" };
    if (payment.status !== "APPROVED" && payment.status !== "PAID") {
      return { ok: false, code: "PAYMENT_NOT_APPROVED", message: `status=${payment.status}` };
    }

    const order = payment.order;
    if (order.financialLedgerPostedAt) {
      const existing = await tx.financialLedgerEntry.findMany({
        where: { paymentId: payment.id },
        select: { id: true },
      });
      let allocation: CommercialAllocation;
      try {
        allocation = validateOrderFinancialSnapshot(order);
      } catch {
        allocation = validateOrderFinancialSnapshot({
          ...order,
          platformPercentage: order.platformPercentage ?? 0,
        });
      }
      return {
        ok: true,
        alreadyPosted: true,
        entryIds: existing.map((e) => e.id),
        allocation,
      };
    }

    let allocation: CommercialAllocation;
    try {
      allocation = validateOrderFinancialSnapshot(order);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "SNAPSHOT_INVALID";
      await writeAuditLog({
        action: "CREATE",
        module: "finance",
        resource: "FinancialLedgerEntry",
        resourceId: payment.id,
        observation: `ledger.post.rejected:${msg}`,
        entityAfter: { paymentId: payment.id, orderId: order.id, source: params.source },
      }).catch(() => undefined);
      return { ok: false, code: msg, message: msg };
    }

    const expectedCents = toCents(payment.amount);
    if (Math.abs(expectedCents - allocation.grossAmountCents) > 1) {
      return {
        ok: false,
        code: "VALUE_DIVERGENT",
        message: "Payment.amount diverge do grossAmount do pedido",
      };
    }

    if (!order.partnerId) {
      return { ok: false, code: "ORDER_WITHOUT_PARTNER", message: "partnerId obrigatório" };
    }

    await ensurePlatformAccounts(tx, order.currency);
    await ensurePartnerAccounts(tx, order.partnerId, order.currency);

    const platformReceivable = await getAccount(tx, "PLATFORM_RECEIVABLE", "platform", order.currency);
    const platformRevenue = await getAccount(tx, "PLATFORM_REVENUE", "platform", order.currency);
    const gatewayFees = await getAccount(tx, "GATEWAY_FEES", "platform", order.currency);
    const taxAcc = await getAccount(tx, "TAX_ESTIMATE", "platform", order.currency);
    const partnerPayable = await getAccount(tx, "PARTNER_PAYABLE", order.partnerId, order.currency);
    const partnerReserve = await getAccount(tx, "RESERVE", order.partnerId, order.currency);

    const baseKey = `pay:${payment.id}`;
    const entryIds: string[] = [];
    const push = async (
      args: Parameters<typeof createEntry>[1]
    ) => {
      const row = await createEntry(tx, args);
      if (row) entryIds.push(row.id);
    };

    await push({
      accountId: platformReceivable.id,
      orderId: order.id,
      paymentId: payment.id,
      partnerId: order.partnerId,
      entryType: "PAYMENT_RECEIVED",
      direction: "CREDIT",
      amountCents: allocation.grossAmountCents,
      status: "POSTED",
      idempotencyKey: `${baseKey}:PAYMENT_RECEIVED`,
      description: "Pagamento recebido (GMV)",
    });

    await push({
      accountId: platformRevenue.id,
      orderId: order.id,
      paymentId: payment.id,
      partnerId: order.partnerId,
      entryType: "PLATFORM_COMMISSION",
      direction: "CREDIT",
      amountCents: allocation.platformPercentageAmountCents,
      status: "POSTED",
      idempotencyKey: `${baseKey}:PLATFORM_COMMISSION`,
      description: "Comissão percentual EccoPet",
    });

    await push({
      accountId: platformRevenue.id,
      orderId: order.id,
      paymentId: payment.id,
      partnerId: order.partnerId,
      entryType: "PLATFORM_FIXED_FEE",
      direction: "CREDIT",
      amountCents: allocation.platformFixedFeeCents,
      status: "POSTED",
      idempotencyKey: `${baseKey}:PLATFORM_FIXED_FEE`,
      description: "Taxa fixa EccoPet",
    });

    await push({
      accountId: gatewayFees.id,
      orderId: order.id,
      paymentId: payment.id,
      partnerId: order.partnerId,
      entryType: "GATEWAY_FEE_ESTIMATED",
      direction: "DEBIT",
      amountCents: allocation.gatewayFeeEstimatedCents,
      status: "POSTED",
      idempotencyKey: `${baseKey}:GATEWAY_FEE_ESTIMATED`,
      description: "Taxa gateway estimada (não é valor real)",
      metadata: { estimated: true },
    });

    await push({
      accountId: partnerPayable.id,
      orderId: order.id,
      paymentId: payment.id,
      partnerId: order.partnerId,
      entryType: "PARTNER_PAYABLE",
      direction: "CREDIT",
      amountCents: allocation.partnerPayableCents,
      status: "BLOCKED",
      idempotencyKey: `${baseKey}:PARTNER_PAYABLE`,
      description: "Valor devido ao parceiro (bloqueado até elegibilidade)",
    });

    if (flags.RESERVE_ENABLED && allocation.reserveAmountCents > 0) {
      await push({
        accountId: partnerReserve.id,
        orderId: order.id,
        paymentId: payment.id,
        partnerId: order.partnerId,
        entryType: "RESERVE_HOLD",
        direction: "CREDIT",
        amountCents: allocation.reserveAmountCents,
        status: "BLOCKED",
        idempotencyKey: `${baseKey}:RESERVE_HOLD`,
        description: "Reserva financeira bloqueada",
      });

      await tx.financialReserve.upsert({
        where: { idempotencyKey: `${baseKey}:reserve` },
        create: {
          orderId: order.id,
          partnerId: order.partnerId,
          paymentId: payment.id,
          amountCents: allocation.reserveAmountCents,
          currency: order.currency,
          reserveReason: "PROVISIONAL_OPERATIONAL_RESERVE",
          status: "HELD",
          idempotencyKey: `${baseKey}:reserve`,
        },
        update: {},
      });
    }

    if (allocation.taxEstimateCents > 0) {
      await push({
        accountId: taxAcc.id,
        orderId: order.id,
        paymentId: payment.id,
        partnerId: order.partnerId,
        entryType: "TAX_ESTIMATE",
        direction: "DEBIT",
        amountCents: allocation.taxEstimateCents,
        status: "POSTED",
        idempotencyKey: `${baseKey}:TAX_ESTIMATE`,
        description: "Imposto estimado operacional (não é obrigação fiscal definitiva)",
        metadata: { taxStatus: "ESTIMATED", base: "PLATFORM_REVENUE" },
      });
    }

    await tx.order.update({
      where: { id: order.id },
      data: { financialLedgerPostedAt: new Date() },
    });

    return { ok: true, alreadyPosted: false, entryIds, allocation };
  };

  try {
    if (params.tx) return await run(params.tx);
    return await prisma.$transaction((tx) => run(tx), { maxWait: 10000, timeout: 30000 });
  } catch (e) {
    const message = e instanceof Error ? e.message : "LEDGER_POST_FAILED";
    await writeAuditLog({
      action: "CREATE",
      module: "finance",
      resource: "FinancialLedgerEntry",
      resourceId: params.paymentId,
      observation: `ledger.post.error:${message}`,
      entityAfter: { source: params.source },
    }).catch(() => undefined);
    return { ok: false, code: "LEDGER_POST_FAILED", message };
  }
}

/** Reprocessamento idempotente se PAID sem ledger (recuperação). */
export async function recoverMissingLedger(paymentId: string) {
  return postLedgerForApprovedPayment({ paymentId, source: "recovery" });
}
