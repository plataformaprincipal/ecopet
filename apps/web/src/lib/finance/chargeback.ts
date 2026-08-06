import "server-only";

import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit-log";
import { createInternalNotification } from "@/lib/notifications/internal";
import { ensurePartnerAccounts, ensurePlatformAccounts, getAccount } from "./accounts";
import { getFinancialFlags } from "./flags";
import { toCents } from "./money";

export async function openFinancialChargeback(params: {
  paymentId: string;
  amount: number;
  reason?: string;
  externalReference?: string;
  idempotencyKey: string;
}): Promise<{ ok: boolean; chargebackId?: string; code?: string }> {
  const flags = getFinancialFlags();
  if (!flags.CHARGEBACKS_ENABLED) {
    return { ok: false, code: "CHARGEBACKS_DISABLED" };
  }

  const existing = await prisma.financialChargeback.findUnique({
    where: { idempotencyKey: params.idempotencyKey },
  });
  if (existing) return { ok: true, chargebackId: existing.id };

  const amountCents = toCents(params.amount);
  if (amountCents <= 0) return { ok: false, code: "INVALID_AMOUNT" };

  try {
    const cb = await prisma.$transaction(async (tx) => {
      const payment = await tx.payment.findUnique({
        where: { id: params.paymentId },
        include: { order: true },
      });
      if (!payment) throw new Error("PAYMENT_NOT_FOUND");
      const order = payment.order;
      const partnerId = order.partnerId;

      const created = await tx.financialChargeback.create({
        data: {
          paymentId: payment.id,
          orderId: order.id,
          partnerId,
          amountCents,
          currency: order.currency,
          reason: params.reason,
          externalReference: params.externalReference,
          status: "OPEN",
          idempotencyKey: params.idempotencyKey,
        },
      });

      await ensurePlatformAccounts(tx, order.currency);
      if (partnerId) await ensurePartnerAccounts(tx, partnerId, order.currency);

      const cbAcc = await getAccount(tx, "CHARGEBACKS", "platform", order.currency);

      await tx.financialLedgerEntry.create({
        data: {
          accountId: cbAcc.id,
          orderId: order.id,
          paymentId: payment.id,
          partnerId,
          chargebackId: created.id,
          entryType: "CHARGEBACK",
          direction: "DEBIT",
          amountCents,
          status: "POSTED",
          idempotencyKey: `cb:${created.id}:CHARGEBACK`,
          description: "Chargeback aberto",
        },
      });

      if (partnerId) {
        const partnerAcc = await getAccount(tx, "PARTNER_PAYABLE", partnerId, order.currency);
        await tx.financialLedgerEntry.create({
          data: {
            accountId: partnerAcc.id,
            orderId: order.id,
            paymentId: payment.id,
            partnerId,
            chargebackId: created.id,
            entryType: "CHARGEBACK",
            direction: "DEBIT",
            amountCents,
            status: "POSTED",
            idempotencyKey: `cb:${created.id}:PARTNER_DEBIT`,
            description: "Débito chargeback no parceiro (pode gerar saldo negativo)",
          },
        });

        // Bloqueia saldos ainda disponíveis do pedido
        await tx.financialLedgerEntry.updateMany({
          where: {
            orderId: order.id,
            partnerId,
            entryType: "PARTNER_PAYABLE",
            status: { in: ["AVAILABLE", "BLOCKED"] },
            payoutId: null,
          },
          data: { status: "BLOCKED" },
        });

        // Consome reserva se houver
        if (flags.RESERVE_ENABLED) {
          const reserve = await tx.financialReserve.findFirst({
            where: { orderId: order.id, status: "HELD" },
          });
          if (reserve) {
            const reserveAcc = await getAccount(tx, "RESERVE", partnerId, order.currency);
            await tx.financialLedgerEntry.create({
              data: {
                accountId: reserveAcc.id,
                orderId: order.id,
                paymentId: payment.id,
                partnerId,
                chargebackId: created.id,
                entryType: "RESERVE_CONSUMPTION",
                direction: "DEBIT",
                amountCents: Math.min(reserve.amountCents, amountCents),
                status: "POSTED",
                idempotencyKey: `cb:${created.id}:RESERVE_CONSUMPTION`,
                description: "Reserva consumida em chargeback",
              },
            });
            await tx.financialReserve.update({
              where: { id: reserve.id },
              data: { status: "CONSUMED", consumedAt: new Date() },
            });
          }
        }
      }

      return created;
    });

    const admins = await prisma.user.findMany({
      where: { role: "ADMIN", accountStatus: "ACTIVE" },
      select: { id: true },
      take: 20,
    });
    for (const a of admins) {
      await createInternalNotification({
        userId: a.id,
        type: "SYSTEM",
        title: "Chargeback aberto",
        body: `Pedido/pagamento em disputa. chargebackId=${cb.id}`,
        actionUrl: "/admin/financeiro",
        data: { chargebackId: cb.id, paymentId: params.paymentId },
      }).catch(() => undefined);
    }

    await writeAuditLog({
      action: "CREATE",
      module: "finance",
      resource: "FinancialChargeback",
      resourceId: cb.id,
      observation: "chargeback.opened",
      entityAfter: { paymentId: params.paymentId, amountCents },
    }).catch(() => undefined);

    return { ok: true, chargebackId: cb.id };
  } catch (e) {
    return { ok: false, code: e instanceof Error ? e.message : "CHARGEBACK_FAILED" };
  }
}

export async function resolveFinancialChargeback(params: {
  chargebackId: string;
  resolution: "WON" | "LOST" | "CANCELLED";
  actorId: string;
  note?: string;
}) {
  const cb = await prisma.financialChargeback.findUnique({ where: { id: params.chargebackId } });
  if (!cb) return { ok: false as const, code: "NOT_FOUND" };
  if (!["OPEN", "UNDER_REVIEW"].includes(cb.status)) {
    return { ok: true as const, chargebackId: cb.id, status: cb.status };
  }

  const updated = await prisma.financialChargeback.update({
    where: { id: cb.id },
    data: {
      status: params.resolution,
      resolvedAt: new Date(),
      resolution: params.note ?? params.resolution,
    },
  });

  // WON: crédito compensatório ao parceiro (não apaga histórico)
  if (params.resolution === "WON" && cb.partnerId) {
    await prisma.$transaction(async (tx) => {
      await ensurePartnerAccounts(tx, cb.partnerId!);
      const partnerAcc = await getAccount(tx, "PARTNER_PAYABLE", cb.partnerId!);
      await tx.financialLedgerEntry.create({
        data: {
          accountId: partnerAcc.id,
          orderId: cb.orderId,
          paymentId: cb.paymentId,
          partnerId: cb.partnerId,
          chargebackId: cb.id,
          entryType: "ADJUSTMENT",
          direction: "CREDIT",
          amountCents: cb.amountCents,
          status: "AVAILABLE",
          availableAt: new Date(),
          idempotencyKey: `cb:${cb.id}:WON_CREDIT`,
          description: "Chargeback ganho — crédito compensatório",
        },
      });
    });
  }

  await writeAuditLog({
    action: "UPDATE",
    module: "finance",
    resource: "FinancialChargeback",
    resourceId: cb.id,
    actorId: params.actorId,
    observation: `chargeback.${params.resolution.toLowerCase()}`,
  }).catch(() => undefined);

  return { ok: true as const, chargebackId: updated.id, status: updated.status };
}
