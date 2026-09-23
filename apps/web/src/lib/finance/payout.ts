import "server-only";

import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit-log";
import { listAvailablePayableEntries } from "./balances";
import { getFinancialFlags } from "./flags";

export type PayoutResult =
  | { ok: true; payoutId: string; status: string; alreadyExists?: boolean }
  | { ok: false; code: string; message: string };

const PAYOUT_PROVIDER_BLOCK = {
  code: "PAYOUT_PROVIDER_NOT_CONFIGURED",
  message:
    "Repasse centralizado não está habilitado: não existe uma API Mercado Pago de transferência configurada e confirmada neste projeto.",
} as const;

/**
 * Centralized payout is fail-closed. The current Mercado Pago integration can charge a connected
 * seller directly with `application_fee`, but it has no verified transfer API for moving funds
 * collected by EcoPet to a bank account. Available ledger entries therefore remain AVAILABLE.
 */
export async function createPartnerPayout(_params: {
  partnerId: string;
  amountCents: number;
  requestedById: string;
  idempotencyKey: string;
  currency?: string;
}): Promise<PayoutResult> {
  const flags = getFinancialFlags();
  if (!flags.PAYOUTS_ENABLED) {
    return {
      ok: false,
      code: "PAYOUTS_DISABLED",
      message: "PAYOUTS_ENABLED=false",
    };
  }
  return { ok: false, ...PAYOUT_PROVIDER_BLOCK };
}

/** Existing requests can be approved for review, but never become PAID without provider proof. */
export async function approvePartnerPayout(params: {
  payoutId: string;
  approvedById: string;
}): Promise<PayoutResult> {
  const payout = await prisma.partnerPayout.findUnique({
    where: { id: params.payoutId },
  });
  if (!payout)
    return { ok: false, code: "NOT_FOUND", message: "Payout não encontrado" };
  if (payout.requestedById === params.approvedById) {
    return {
      ok: false,
      code: "SELF_APPROVAL_FORBIDDEN",
      message: "Parceiro/solicitante não pode autoaprovar",
    };
  }
  if (payout.status !== "PENDING") {
    return {
      ok: true,
      payoutId: payout.id,
      status: payout.status,
      alreadyExists: true,
    };
  }

  const updated = await prisma.partnerPayout.update({
    where: { id: payout.id },
    data: {
      status: "APPROVED",
      approvedAt: new Date(),
      approvedById: params.approvedById,
    },
  });
  await writeAuditLog({
    action: "UPDATE",
    module: "finance",
    resource: "PartnerPayout",
    resourceId: payout.id,
    actorId: params.approvedById,
    observation: "payout.approved_pending_provider_transfer",
  }).catch(() => undefined);
  return { ok: true, payoutId: updated.id, status: updated.status };
}

export async function cancelPartnerPayout(params: {
  payoutId: string;
  actorId: string;
  reason: string;
}): Promise<PayoutResult> {
  if (!params.reason?.trim()) {
    return {
      ok: false,
      code: "REASON_REQUIRED",
      message: "Motivo obrigatório para cancelar repasse.",
    };
  }
  const payout = await prisma.partnerPayout.findUnique({
    where: { id: params.payoutId },
  });
  if (!payout)
    return { ok: false, code: "NOT_FOUND", message: "Payout não encontrado" };
  if (["PAID", "CANCELLED", "REVERSED"].includes(payout.status)) {
    return {
      ok: false,
      code: "INVALID_STATUS",
      message: `status=${payout.status}`,
    };
  }
  await prisma.partnerPayout.update({
    where: { id: payout.id },
    data: {
      status: "CANCELLED",
      cancelledAt: new Date(),
      failureReason: params.reason,
    },
  });
  await writeAuditLog({
    action: "UPDATE",
    module: "finance",
    resource: "PartnerPayout",
    resourceId: payout.id,
    actorId: params.actorId,
    observation: "payout.cancelled_before_provider_transfer",
    entityAfter: { reason: params.reason },
  }).catch(() => undefined);
  return { ok: true, payoutId: payout.id, status: "CANCELLED" };
}

export { listAvailablePayableEntries, PAYOUT_PROVIDER_BLOCK };
