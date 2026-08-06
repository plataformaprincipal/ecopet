import "server-only";

import { OrderStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit-log";
import { ensurePartnerAccounts, getAccount } from "./accounts";
import { getFinancialFlags } from "./flags";

const ELIGIBLE_ORDER_STATUS: OrderStatus[] = [
  OrderStatus.COMPLETED,
  OrderStatus.DELIVERED,
  OrderStatus.PICKED_UP,
];

/**
 * Converte PARTNER_PAYABLE BLOCKED → AVAILABLE quando elegível.
 * Idempotente; gera audit log.
 */
export async function releaseEligiblePartnerBalances(params?: {
  partnerId?: string;
  orderId?: string;
  actorId?: string | null;
  now?: Date;
}): Promise<{ releasedEntries: number; releasedReserves: number }> {
  const flags = getFinancialFlags();
  if (!flags.FINANCIAL_LEDGER_ENABLED) {
    return { releasedEntries: 0, releasedReserves: 0 };
  }

  const now = params?.now ?? new Date();
  const settings = await prisma.platformSettings.findUnique({ where: { id: "singleton" } });
  const holdDays = settings?.reserveHoldDays ?? 7;

  const blocked = await prisma.financialLedgerEntry.findMany({
    where: {
      entryType: "PARTNER_PAYABLE",
      status: "BLOCKED",
      ...(params?.partnerId ? { partnerId: params.partnerId } : {}),
      ...(params?.orderId ? { orderId: params.orderId } : {}),
    },
    take: 200,
  });

  let releasedEntries = 0;
  let releasedReserves = 0;

  for (const entry of blocked) {
    if (!entry.orderId || !entry.partnerId) continue;

    const order = await prisma.order.findUnique({
      where: { id: entry.orderId },
      select: {
        id: true,
        status: true,
        updatedAt: true,
        partnerId: true,
      },
    });
    if (!order) continue;
    if (!ELIGIBLE_ORDER_STATUS.includes(order.status)) continue;

    const openCb = await prisma.financialChargeback.count({
      where: {
        orderId: order.id,
        status: { in: ["OPEN", "UNDER_REVIEW"] },
      },
    });
    if (openCb > 0) continue;

    const openDispute = await prisma.mpDispute.count({
      where: { orderId: order.id, payoutBlocked: true },
    });
    if (openDispute > 0) continue;

    const eligibleAt = new Date(order.updatedAt);
    eligibleAt.setDate(eligibleAt.getDate() + holdDays);
    if (eligibleAt > now) continue;

    const key = `release:${entry.id}`;
    await prisma.$transaction(async (tx) => {
      const current = await tx.financialLedgerEntry.findUnique({ where: { id: entry.id } });
      if (!current || current.status !== "BLOCKED") return;

      await tx.financialLedgerEntry.update({
        where: { id: entry.id },
        data: { status: "AVAILABLE", availableAt: now },
      });

      // Liberação de reserva do pedido (se habilitada e elegível)
      if (flags.RESERVE_ENABLED) {
        const reserve = await tx.financialReserve.findFirst({
          where: { orderId: order.id, status: "HELD" },
        });
        if (reserve && (!reserve.availableAt || reserve.availableAt <= now)) {
          await ensurePartnerAccounts(tx, entry.partnerId!);
          const reserveAcc = await getAccount(tx, "RESERVE", entry.partnerId!);
          const payableAcc = await getAccount(tx, "PARTNER_PAYABLE", entry.partnerId!);

          await tx.financialLedgerEntry.create({
            data: {
              accountId: reserveAcc.id,
              orderId: order.id,
              paymentId: entry.paymentId,
              partnerId: entry.partnerId,
              entryType: "RESERVE_RELEASE",
              direction: "DEBIT",
              amountCents: reserve.amountCents,
              status: "POSTED",
              idempotencyKey: `${key}:RESERVE_RELEASE`,
              description: "Liberação de reserva",
            },
          }).catch(() => null);

          await tx.financialLedgerEntry.create({
            data: {
              accountId: payableAcc.id,
              orderId: order.id,
              paymentId: entry.paymentId,
              partnerId: entry.partnerId,
              entryType: "PARTNER_PAYABLE",
              direction: "CREDIT",
              amountCents: reserve.amountCents,
              status: "AVAILABLE",
              availableAt: now,
              idempotencyKey: `${key}:RESERVE_TO_PAYABLE`,
              description: "Reserva liberada para saldo disponível",
            },
          }).catch(() => null);

          await tx.financialReserve.update({
            where: { id: reserve.id },
            data: { status: "RELEASED", releasedAt: now },
          });
          releasedReserves += 1;
        }
      }

      releasedEntries += 1;
    });

    await writeAuditLog({
      action: "UPDATE",
      module: "finance",
      resource: "FinancialLedgerEntry",
      resourceId: entry.id,
      actorId: params?.actorId ?? undefined,
      observation: "balance.released",
      entityAfter: { orderId: entry.orderId, partnerId: entry.partnerId },
    }).catch(() => undefined);
  }

  return { releasedEntries, releasedReserves };
}
