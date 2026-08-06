import "server-only";

import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit-log";
import { ensurePartnerAccounts, ensurePlatformAccounts, getAccount } from "./accounts";
import type { FinancialLedgerDirection } from "@prisma/client";

/**
 * Ajuste manual admin. Sem justificativa → rejeitado.
 * Dupla aprovação: se amount > limite e sem approver distinto → PENDING_APPROVAL.
 */
export async function createManualAdjustment(params: {
  partnerId?: string | null;
  amountCents: number;
  direction: FinancialLedgerDirection;
  reason: string;
  evidence?: string;
  actorId: string;
  approverId?: string;
  idempotencyKey: string;
}) {
  if (!params.reason?.trim()) {
    return { ok: false as const, code: "REASON_REQUIRED" };
  }
  if (!Number.isInteger(params.amountCents) || params.amountCents <= 0) {
    return { ok: false as const, code: "INVALID_AMOUNT" };
  }

  const existing = await prisma.financialManualAdjustment.findUnique({
    where: { idempotencyKey: params.idempotencyKey },
  });
  if (existing) {
    return { ok: true as const, adjustmentId: existing.id, alreadyExists: true };
  }

  const settings = await prisma.platformSettings.findUnique({ where: { id: "singleton" } });
  const limitCents = Math.round((settings?.manualAdjustmentDualApprovalLimit ?? 500) * 100);
  const needsDual = limitCents > 0 && params.amountCents > limitCents;
  if (needsDual && (!params.approverId || params.approverId === params.actorId)) {
    const pending = await prisma.financialManualAdjustment.create({
      data: {
        partnerId: params.partnerId ?? null,
        amountCents: params.amountCents,
        direction: params.direction,
        reason: params.reason,
        evidence: params.evidence,
        actorId: params.actorId,
        approvalStatus: "PENDING_APPROVAL",
        idempotencyKey: params.idempotencyKey,
      },
    });
    await writeAuditLog({
      action: "CREATE",
      module: "finance",
      resource: "FinancialManualAdjustment",
      resourceId: pending.id,
      actorId: params.actorId,
      observation: "adjustment.pending_approval",
    }).catch(() => undefined);
    return { ok: true as const, adjustmentId: pending.id, pendingApproval: true };
  }

  const result = await prisma.$transaction(async (tx) => {
    await ensurePlatformAccounts(tx);
    const ownerKey = params.partnerId ?? "platform";
    if (params.partnerId) await ensurePartnerAccounts(tx, params.partnerId);
    const account = params.partnerId
      ? await getAccount(tx, "PARTNER_PAYABLE", params.partnerId)
      : await getAccount(tx, "PLATFORM_REVENUE", "platform");

    const entry = await tx.financialLedgerEntry.create({
      data: {
        accountId: account.id,
        partnerId: params.partnerId ?? null,
        entryType: "ADJUSTMENT",
        direction: params.direction,
        amountCents: params.amountCents,
        status: "AVAILABLE",
        availableAt: new Date(),
        idempotencyKey: `adj:${params.idempotencyKey}`,
        description: params.reason.slice(0, 280),
        metadata: { evidence: params.evidence ?? null, actorId: params.actorId },
      },
    });

    const adj = await tx.financialManualAdjustment.create({
      data: {
        partnerId: params.partnerId ?? null,
        accountId: account.id,
        amountCents: params.amountCents,
        direction: params.direction,
        reason: params.reason,
        evidence: params.evidence,
        actorId: params.actorId,
        approverId: params.approverId ?? params.actorId,
        approvalStatus: "APPROVED",
        idempotencyKey: params.idempotencyKey,
        ledgerEntryId: entry.id,
      },
    });

    return { adj, entry };
  });

  await writeAuditLog({
    action: "CREATE",
    module: "finance",
    resource: "FinancialManualAdjustment",
    resourceId: result.adj.id,
    actorId: params.actorId,
    observation: "adjustment.created",
    entityAfter: {
      amountCents: params.amountCents,
      direction: params.direction,
      partnerId: params.partnerId,
    },
  }).catch(() => undefined);

  return {
    ok: true as const,
    adjustmentId: result.adj.id,
    ledgerEntryId: result.entry.id,
  };
}
