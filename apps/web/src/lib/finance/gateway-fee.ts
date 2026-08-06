import "server-only";

import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit-log";
import { ensurePlatformAccounts, getAccount } from "./accounts";
import { toCents } from "./money";

/**
 * Atualiza taxa real do gateway sem editar lançamento histórico.
 * Diferença → GATEWAY_FEE_ADJUSTMENT.
 * Política provisória: diferença positiva (custo maior) absorvida pela plataforma.
 */
export async function applyGatewayFeeActual(params: {
  orderId: string;
  gatewayFeeActual: number;
  actorId?: string;
}) {
  const order = await prisma.order.findUnique({ where: { id: params.orderId } });
  if (!order) return { ok: false as const, code: "ORDER_NOT_FOUND" };

  const actualCents = toCents(params.gatewayFeeActual);
  const estimatedCents = toCents(order.gatewayFeeEstimated);
  const diff = actualCents - estimatedCents;

  await prisma.order.update({
    where: { id: order.id },
    data: { gatewayFeeActual: params.gatewayFeeActual },
  });

  if (diff === 0) {
    return { ok: true as const, differenceCents: 0 };
  }

  const payment = await prisma.payment.findFirst({
    where: { orderId: order.id, status: { in: ["APPROVED", "PAID"] } },
    orderBy: { createdAt: "desc" },
  });

  await prisma.$transaction(async (tx) => {
    await ensurePlatformAccounts(tx, order.currency);
    const gatewayAcc = await getAccount(tx, "GATEWAY_FEES", "platform", order.currency);
    await tx.financialLedgerEntry.create({
      data: {
        accountId: gatewayAcc.id,
        orderId: order.id,
        paymentId: payment?.id,
        partnerId: order.partnerId,
        entryType: "GATEWAY_FEE_ADJUSTMENT",
        direction: diff > 0 ? "DEBIT" : "CREDIT",
        amountCents: Math.abs(diff),
        status: "POSTED",
        idempotencyKey: `gfee:${order.id}:${actualCents}`,
        description: "Ajuste taxa gateway real vs estimada",
        metadata: {
          gatewayFeeEstimated: order.gatewayFeeEstimated,
          gatewayFeeActual: params.gatewayFeeActual,
          gatewayFeeDifference: diff / 100,
          policy: "PLATFORM_ABSORBS_DIFFERENCE",
        },
      },
    });
  });

  await writeAuditLog({
    action: "UPDATE",
    module: "finance",
    resource: "Order",
    resourceId: order.id,
    actorId: params.actorId,
    observation: "gateway.fee.actual",
    entityAfter: { actualCents, estimatedCents, diff },
  }).catch(() => undefined);

  return { ok: true as const, differenceCents: diff };
}
