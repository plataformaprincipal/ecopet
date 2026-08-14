import type { LoyaltyTier, LoyaltyTxnType, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

const TIER_THRESHOLDS: Array<{ tier: LoyaltyTier; minLifetime: number }> = [
  { tier: "ECCO_PREMIUM", minLifetime: 5000 },
  { tier: "ECCO_PLUS", minLifetime: 1000 },
  { tier: "ECCO", minLifetime: 0 },
];

export class LoyaltyError extends Error {
  constructor(
    message: string,
    public code: string,
    public status = 400
  ) {
    super(message);
  }
}

export async function getOrCreateLoyaltyAccount(userId: string) {
  const existing = await prisma.loyaltyAccount.findUnique({
    where: { userId },
    include: { transactions: { orderBy: { createdAt: "desc" }, take: 20 } },
  });
  if (existing) return existing;

  return prisma.loyaltyAccount.create({
    data: { userId, updatedAt: new Date() },
    include: { transactions: { orderBy: { createdAt: "desc" }, take: 20 } },
  });
}

function resolveTier(lifetimePoints: number): LoyaltyTier {
  for (const row of TIER_THRESHOLDS) {
    if (lifetimePoints >= row.minLifetime) return row.tier;
  }
  return "ECCO";
}

/**
 * Ledger idempotente: mesmo idempotencyKey retorna a transação existente sem duplicar saldo.
 */
export async function applyLoyaltyTransaction(params: {
  userId: string;
  type: LoyaltyTxnType;
  points: number;
  sourceType?: string;
  sourceId?: string;
  description?: string;
  idempotencyKey?: string;
  expiresAt?: Date;
}) {
  if (!Number.isFinite(params.points) || params.points === 0) {
    throw new LoyaltyError("Pontos inválidos.", "VALIDATION", 400);
  }
  if (params.type === "EARN" && params.points < 0) {
    throw new LoyaltyError("Crédito deve ser positivo.", "VALIDATION", 400);
  }
  if ((params.type === "REDEEM" || params.type === "EXPIRE") && params.points > 0) {
    // normalizar: débitos armazenados como valor negativo no ledger
    params = { ...params, points: -Math.abs(params.points) };
  }

  if (params.idempotencyKey) {
    const existing = await prisma.loyaltyTransaction.findUnique({
      where: { idempotencyKey: params.idempotencyKey },
      include: { account: true },
    });
    if (existing) {
      return { account: existing.account, transaction: existing, duplicated: true as const };
    }
  }

  return prisma.$transaction(async (tx) => {
    let account = await tx.loyaltyAccount.findUnique({ where: { userId: params.userId } });
    if (!account) {
      account = await tx.loyaltyAccount.create({
        data: { userId: params.userId, updatedAt: new Date() },
      });
    }

    const nextBalance = account.pointsBalance + params.points;
    if (nextBalance < 0) {
      throw new LoyaltyError("Saldo de EccoPontos insuficiente.", "INSUFFICIENT_POINTS", 400);
    }

    const lifetimeDelta = params.points > 0 ? params.points : 0;
    const lifetimePoints = account.lifetimePoints + lifetimeDelta;
    const tier = resolveTier(lifetimePoints);

    const transaction = await tx.loyaltyTransaction.create({
      data: {
        loyaltyAccountId: account.id,
        type: params.type,
        points: params.points,
        sourceType: params.sourceType,
        sourceId: params.sourceId,
        description: params.description,
        idempotencyKey: params.idempotencyKey,
        expiresAt: params.expiresAt,
      },
    });

    const updated = await tx.loyaltyAccount.update({
      where: { id: account.id },
      data: {
        pointsBalance: nextBalance,
        lifetimePoints,
        tier,
      },
    });

    return { account: updated, transaction, duplicated: false as const };
  });
}

/** Credita pontos de pedido pago — idempotente por orderId. */
export async function earnPointsForOrder(params: {
  userId: string;
  orderId: string;
  points: number;
  description?: string;
}) {
  return applyLoyaltyTransaction({
    userId: params.userId,
    type: "EARN",
    points: Math.abs(params.points),
    sourceType: "ORDER",
    sourceId: params.orderId,
    description: params.description ?? "Pontos por compra concluída",
    idempotencyKey: `earn:order:${params.orderId}`,
  });
}

/** Estorna pontos de um pedido (cancelamento/reembolso) — idempotente. */
export async function reversePointsForOrder(params: {
  userId: string;
  orderId: string;
  points: number;
  description?: string;
}) {
  return applyLoyaltyTransaction({
    userId: params.userId,
    type: "ADJUSTMENT",
    points: -Math.abs(params.points),
    sourceType: "ORDER_REFUND",
    sourceId: params.orderId,
    description: params.description ?? "Estorno de pontos por cancelamento/reembolso",
    idempotencyKey: `reverse:order:${params.orderId}`,
  });
}

export async function listMembershipPlans() {
  return prisma.membershipPlan.findMany({
    where: { isActive: true },
    include: { benefits: true },
    orderBy: { priceCents: "asc" },
  });
}

export type LoyaltyAccountDTO = Prisma.LoyaltyAccountGetPayload<{
  include: { transactions: true };
}>;
