import "server-only";

import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit-log";
import { ensurePartnerAccounts, getAccount } from "./accounts";
import { listAvailablePayableEntries, getPartnerBalances } from "./balances";
import { getFinancialFlags } from "./flags";

export type PayoutResult =
  | { ok: true; payoutId: string; status: string; alreadyExists?: boolean }
  | { ok: false; code: string; message: string };

/**
 * Cria repasse sandbox consumindo saldo AVAILABLE (reserva lançamentos).
 * Não executa transferência bancária.
 */
export async function createPartnerPayout(params: {
  partnerId: string;
  amountCents: number;
  requestedById: string;
  idempotencyKey: string;
  currency?: string;
}): Promise<PayoutResult> {
  const flags = getFinancialFlags();
  if (!flags.PAYOUTS_ENABLED) {
    return { ok: false, code: "PAYOUTS_DISABLED", message: "PAYOUTS_ENABLED=false" };
  }
  if (!Number.isInteger(params.amountCents) || params.amountCents <= 0) {
    return { ok: false, code: "INVALID_AMOUNT", message: "amountCents inválido" };
  }

  const existing = await prisma.partnerPayout.findUnique({
    where: { idempotencyKey: params.idempotencyKey },
  });
  if (existing) {
    return { ok: true, payoutId: existing.id, status: existing.status, alreadyExists: true };
  }

  const balances = await getPartnerBalances(params.partnerId, params.currency ?? "BRL");
  if (balances.negativeCents > 0) {
    return { ok: false, code: "NEGATIVE_BALANCE", message: "Repasse bloqueado: saldo negativo" };
  }
  if (params.amountCents > balances.availableCents) {
    return { ok: false, code: "INSUFFICIENT_AVAILABLE", message: "Saldo disponível insuficiente" };
  }

  try {
    const payout = await prisma.$transaction(async (tx) => {
      const again = await tx.partnerPayout.findUnique({
        where: { idempotencyKey: params.idempotencyKey },
      });
      if (again) return again;

      const entries = await tx.financialLedgerEntry.findMany({
        where: {
          partnerId: params.partnerId,
          currency: params.currency ?? "BRL",
          entryType: "PARTNER_PAYABLE",
          status: "AVAILABLE",
          payoutId: null,
          direction: "CREDIT",
        },
        orderBy: { occurredAt: "asc" },
      });

      let remaining = params.amountCents;
      const used: string[] = [];
      for (const e of entries) {
        if (remaining <= 0) break;
        // Consome o lançamento inteiro (não parcial nesta fase)
        if (e.amountCents > remaining) continue;
        used.push(e.id);
        remaining -= e.amountCents;
      }
      if (remaining > 0) {
        throw new Error("INSUFFICIENT_AVAILABLE_ENTRIES");
      }

      const created = await tx.partnerPayout.create({
        data: {
          partnerId: params.partnerId,
          amountCents: params.amountCents,
          currency: params.currency ?? "BRL",
          status: flags.MANUAL_PAYOUT_APPROVAL_REQUIRED ? "PENDING" : "APPROVED",
          approvedAt: flags.MANUAL_PAYOUT_APPROVAL_REQUIRED ? null : new Date(),
          requestedById: params.requestedById,
          idempotencyKey: params.idempotencyKey,
          metadata: { sandbox: true, entryIds: used },
        },
      });

      await ensurePartnerAccounts(tx, params.partnerId);
      const payableAcc = await getAccount(tx, "PARTNER_PAYABLE", params.partnerId);

      await tx.financialLedgerEntry.updateMany({
        where: { id: { in: used } },
        data: { payoutId: created.id, status: "SETTLED" },
      });

      await tx.financialLedgerEntry.create({
        data: {
          accountId: payableAcc.id,
          partnerId: params.partnerId,
          payoutId: created.id,
          entryType: "PAYOUT",
          direction: "DEBIT",
          amountCents: params.amountCents,
          status: "PENDING",
          idempotencyKey: `payout:${created.id}:PAYOUT`,
          description: "Repasse sandbox — saldo reservado",
        },
      });

      return created;
    });

    await writeAuditLog({
      action: "CREATE",
      module: "finance",
      resource: "PartnerPayout",
      resourceId: payout.id,
      actorId: params.requestedById,
      observation: "payout.created",
      entityAfter: { amountCents: params.amountCents, partnerId: params.partnerId },
    }).catch(() => undefined);

    return { ok: true, payoutId: payout.id, status: payout.status };
  } catch (e) {
    const message = e instanceof Error ? e.message : "PAYOUT_FAILED";
    return { ok: false, code: message, message };
  }
}

export async function approvePartnerPayout(params: {
  payoutId: string;
  approvedById: string;
}): Promise<PayoutResult> {
  const flags = getFinancialFlags();
  if (!flags.PAYOUTS_ENABLED) {
    return { ok: false, code: "PAYOUTS_DISABLED", message: "PAYOUTS_ENABLED=false" };
  }

  const payout = await prisma.partnerPayout.findUnique({ where: { id: params.payoutId } });
  if (!payout) return { ok: false, code: "NOT_FOUND", message: "Payout não encontrado" };
  if (payout.requestedById === params.approvedById) {
    return { ok: false, code: "SELF_APPROVAL_FORBIDDEN", message: "Parceiro/solicitante não pode autoaprovar" };
  }
  if (payout.status !== "PENDING") {
    return { ok: true, payoutId: payout.id, status: payout.status, alreadyExists: true };
  }

  const updated = await prisma.partnerPayout.update({
    where: { id: payout.id },
    data: { status: "APPROVED", approvedAt: new Date(), approvedById: params.approvedById },
  });

  await writeAuditLog({
    action: "UPDATE",
    module: "finance",
    resource: "PartnerPayout",
    resourceId: payout.id,
    actorId: params.approvedById,
    observation: "payout.approved",
  }).catch(() => undefined);

  return { ok: true, payoutId: updated.id, status: updated.status };
}

/** Marca pago em sandbox — ação administrativa auditada. Sem transferência real. */
export async function markPartnerPayoutPaidSandbox(params: {
  payoutId: string;
  paidById: string;
  externalReference?: string;
}): Promise<PayoutResult> {
  const payout = await prisma.partnerPayout.findUnique({ where: { id: params.payoutId } });
  if (!payout) return { ok: false, code: "NOT_FOUND", message: "Payout não encontrado" };
  if (payout.status === "PAID") {
    return { ok: true, payoutId: payout.id, status: "PAID", alreadyExists: true };
  }
  if (!["APPROVED", "PROCESSING"].includes(payout.status)) {
    return { ok: false, code: "INVALID_STATUS", message: `status=${payout.status}` };
  }

  const updated = await prisma.$transaction(async (tx) => {
    const row = await tx.partnerPayout.update({
      where: { id: payout.id },
      data: {
        status: "PAID",
        paidAt: new Date(),
        processedAt: new Date(),
        paidById: params.paidById,
        externalReference: params.externalReference ?? `sandbox:${payout.id}`,
      },
    });
    await tx.financialLedgerEntry.updateMany({
      where: { payoutId: payout.id, entryType: "PAYOUT" },
      data: { status: "SETTLED" },
    });
    return row;
  });

  await writeAuditLog({
    action: "UPDATE",
    module: "finance",
    resource: "PartnerPayout",
    resourceId: payout.id,
    actorId: params.paidById,
    observation: "payout.paid",
    entityAfter: { sandbox: true },
  }).catch(() => undefined);

  return { ok: true, payoutId: updated.id, status: updated.status };
}

export async function cancelPartnerPayout(params: {
  payoutId: string;
  actorId: string;
  reason: string;
}): Promise<PayoutResult> {
  const payout = await prisma.partnerPayout.findUnique({ where: { id: params.payoutId } });
  if (!payout) return { ok: false, code: "NOT_FOUND", message: "Payout não encontrado" };
  if (["PAID", "CANCELLED", "REVERSED"].includes(payout.status)) {
    return { ok: false, code: "INVALID_STATUS", message: `status=${payout.status}` };
  }

  await prisma.$transaction(async (tx) => {
    await tx.partnerPayout.update({
      where: { id: payout.id },
      data: {
        status: "CANCELLED",
        cancelledAt: new Date(),
        failureReason: params.reason,
      },
    });
    await tx.financialLedgerEntry.updateMany({
      where: { payoutId: payout.id, entryType: "PARTNER_PAYABLE" },
      data: { payoutId: null, status: "AVAILABLE" },
    });
    await tx.financialLedgerEntry.updateMany({
      where: { payoutId: payout.id, entryType: "PAYOUT" },
      data: { status: "CANCELLED" },
    });
  });

  await writeAuditLog({
    action: "UPDATE",
    module: "finance",
    resource: "PartnerPayout",
    resourceId: payout.id,
    actorId: params.actorId,
    observation: "payout.cancelled",
    entityAfter: { reason: params.reason },
  }).catch(() => undefined);

  return { ok: true, payoutId: payout.id, status: "CANCELLED" };
}

export { listAvailablePayableEntries };
