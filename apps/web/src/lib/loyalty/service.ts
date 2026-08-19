import type { LoyaltyTier, LoyaltyTxnType, Prisma } from "@prisma/client";
import { Prisma as PrismaNS } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  adjustmentKey,
  computeReversalPoints,
  earnOrderKey,
  earnServiceKey,
  expiresAtFromPolicy,
  normalizeLedgerPoints,
  redeemKey,
  reverseOrderKey,
  reverseServiceKey,
} from "./rules";
import { getOrCreateLoyaltyPolicy } from "./policy";

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
    include: { transactions: { orderBy: { createdAt: "desc" }, take: 30 } },
  });
  if (existing) return existing;

  try {
    return await prisma.loyaltyAccount.create({
      data: { userId, updatedAt: new Date() },
      include: { transactions: { orderBy: { createdAt: "desc" }, take: 30 } },
    });
  } catch (e) {
    if (e instanceof PrismaNS.PrismaClientKnownRequestError && e.code === "P2002") {
      return prisma.loyaltyAccount.findUniqueOrThrow({
        where: { userId },
        include: { transactions: { orderBy: { createdAt: "desc" }, take: 30 } },
      });
    }
    throw e;
  }
}

function resolveTier(lifetimePoints: number): LoyaltyTier {
  for (const row of TIER_THRESHOLDS) {
    if (lifetimePoints >= row.minLifetime) return row.tier;
  }
  return "ECCO";
}

function isUniqueConflict(e: unknown) {
  return e instanceof PrismaNS.PrismaClientKnownRequestError && e.code === "P2002";
}

async function findByIdempotency(tx: Prisma.TransactionClient | typeof prisma, key: string) {
  return tx.loyaltyTransaction.findUnique({
    where: { idempotencyKey: key },
    include: { account: true },
  });
}

/**
 * Ledger idempotente com lock de linha.
 * overdraftPolicy=forbid: saldo nunca negativo.
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
  metadata?: Prisma.InputJsonValue;
}) {
  const points = normalizeLedgerPoints(params.type, params.points);
  if (points === 0) {
    throw new LoyaltyError("Pontos inválidos.", "VALIDATION", 400);
  }
  if (params.type === "EARN" && points < 0) {
    throw new LoyaltyError("Crédito deve ser positivo.", "VALIDATION", 400);
  }

  if (params.idempotencyKey) {
    const existing = await findByIdempotency(prisma, params.idempotencyKey);
    if (existing) {
      return { account: existing.account, transaction: existing, duplicated: true as const };
    }
  }

  try {
    return await prisma.$transaction(async (tx) => {
      if (params.idempotencyKey) {
        const raced = await findByIdempotency(tx, params.idempotencyKey);
        if (raced) {
          return { account: raced.account, transaction: raced, duplicated: true as const };
        }
      }

      let account = await tx.loyaltyAccount.findUnique({ where: { userId: params.userId } });
      if (!account) {
        try {
          account = await tx.loyaltyAccount.create({
            data: { userId: params.userId, updatedAt: new Date() },
          });
        } catch (e) {
          if (!isUniqueConflict(e)) throw e;
          account = await tx.loyaltyAccount.findUniqueOrThrow({ where: { userId: params.userId } });
        }
      }

      await tx.$executeRaw`SELECT id FROM "LoyaltyAccount" WHERE id = ${account.id} FOR UPDATE`;
      account = await tx.loyaltyAccount.findUniqueOrThrow({ where: { id: account.id } });

      const nextBalance = account.pointsBalance + points;
      if (nextBalance < 0) {
        throw new LoyaltyError("Você não tem pontos suficientes para esta recompensa.", "INSUFFICIENT_POINTS", 400);
      }

      const lifetimeDelta = points > 0 ? points : 0;
      const lifetimePoints = account.lifetimePoints + lifetimeDelta;
      const tier = resolveTier(lifetimePoints);

      const transaction = await tx.loyaltyTransaction.create({
        data: {
          loyaltyAccountId: account.id,
          type: params.type,
          points,
          sourceType: params.sourceType,
          sourceId: params.sourceId,
          description: params.description,
          idempotencyKey: params.idempotencyKey,
          expiresAt: params.expiresAt,
          metadata: params.metadata,
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
  } catch (e) {
    if (params.idempotencyKey && isUniqueConflict(e)) {
      const existing = await findByIdempotency(prisma, params.idempotencyKey);
      if (existing) {
        return { account: existing.account, transaction: existing, duplicated: true as const };
      }
    }
    throw e;
  }
}

export async function earnPointsForOrder(params: {
  userId: string;
  orderId: string;
  points: number;
  description?: string;
  expiresAt?: Date;
}) {
  return applyLoyaltyTransaction({
    userId: params.userId,
    type: "EARN",
    points: Math.abs(params.points),
    sourceType: "ORDER",
    sourceId: params.orderId,
    description: params.description ?? "Compra concluída",
    idempotencyKey: earnOrderKey(params.orderId),
    expiresAt: params.expiresAt,
  });
}

export async function earnPointsForService(params: {
  userId: string;
  appointmentId: string;
  points: number;
  description?: string;
  expiresAt?: Date;
}) {
  return applyLoyaltyTransaction({
    userId: params.userId,
    type: "EARN",
    points: Math.abs(params.points),
    sourceType: "SERVICE",
    sourceId: params.appointmentId,
    description: params.description ?? "Serviço concluído",
    idempotencyKey: earnServiceKey(params.appointmentId),
    expiresAt: params.expiresAt,
  });
}

export async function reversePointsForOrder(params: {
  userId: string;
  orderId: string;
  refundId?: string;
  fraction?: number;
  description?: string;
}) {
  const account = await getOrCreateLoyaltyAccount(params.userId);
  const [earnedAgg, reversedAgg] = await Promise.all([
    prisma.loyaltyTransaction.aggregate({
      where: { loyaltyAccountId: account.id, sourceType: "ORDER", sourceId: params.orderId, type: "EARN" },
      _sum: { points: true },
    }),
    prisma.loyaltyTransaction.aggregate({
      where: { loyaltyAccountId: account.id, sourceType: "ORDER", sourceId: params.orderId, type: "REVERSAL" },
      _sum: { points: true },
    }),
  ]);
  const earned = earnedAgg._sum.points ?? 0;
  const alreadyReversed = Math.abs(reversedAgg._sum.points ?? 0);
  const fresh = await prisma.loyaltyAccount.findUniqueOrThrow({ where: { id: account.id } });
  const { toReverse, unrecovered } = computeReversalPoints({
    earned,
    alreadyReversed,
    availableBalance: fresh.pointsBalance,
    fraction: params.fraction,
  });
  if (toReverse <= 0) {
    return { skipped: true as const, unrecovered, toReverse: 0 };
  }
  const result = await applyLoyaltyTransaction({
    userId: params.userId,
    type: "REVERSAL",
    points: -toReverse,
    sourceType: "ORDER",
    sourceId: params.orderId,
    description: params.description ?? "Estorno de pontos da compra",
    idempotencyKey: reverseOrderKey(params.orderId, params.refundId),
    metadata: unrecovered > 0 ? { unrecovered } : undefined,
  });
  return { ...result, skipped: false as const, unrecovered, toReverse };
}

export async function reversePointsForService(params: {
  userId: string;
  appointmentId: string;
  description?: string;
}) {
  const account = await getOrCreateLoyaltyAccount(params.userId);
  const [earnedAgg, reversedAgg] = await Promise.all([
    prisma.loyaltyTransaction.aggregate({
      where: { loyaltyAccountId: account.id, sourceType: "SERVICE", sourceId: params.appointmentId, type: "EARN" },
      _sum: { points: true },
    }),
    prisma.loyaltyTransaction.aggregate({
      where: { loyaltyAccountId: account.id, sourceType: "SERVICE", sourceId: params.appointmentId, type: "REVERSAL" },
      _sum: { points: true },
    }),
  ]);
  const earned = earnedAgg._sum.points ?? 0;
  const alreadyReversed = Math.abs(reversedAgg._sum.points ?? 0);
  const fresh = await prisma.loyaltyAccount.findUniqueOrThrow({ where: { id: account.id } });
  const { toReverse, unrecovered } = computeReversalPoints({
    earned,
    alreadyReversed,
    availableBalance: fresh.pointsBalance,
  });
  if (toReverse <= 0) {
    return { skipped: true as const, unrecovered, toReverse: 0 };
  }
  const result = await applyLoyaltyTransaction({
    userId: params.userId,
    type: "REVERSAL",
    points: -toReverse,
    sourceType: "SERVICE",
    sourceId: params.appointmentId,
    description: params.description ?? "Estorno de pontos do serviço",
    idempotencyKey: reverseServiceKey(params.appointmentId),
    metadata: unrecovered > 0 ? { unrecovered } : undefined,
  });
  return { ...result, skipped: false as const, unrecovered, toReverse };
}

export async function redeemLoyaltyReward(params: {
  userId: string;
  rewardId: string;
  requestId: string;
}) {
  const policy = await getOrCreateLoyaltyPolicy();
  if (!policy.enabled) {
    throw new LoyaltyError("EccoPontos está temporariamente indisponível.", "DISABLED", 400);
  }

  const reward = await prisma.loyaltyReward.findFirst({
    where: { id: params.rewardId, isActive: true },
  });
  if (!reward) {
    throw new LoyaltyError("Recompensa indisponível.", "NOT_FOUND", 404);
  }
  if (reward.pointsCost < policy.minRedeemPoints) {
    throw new LoyaltyError("Recompensa abaixo do mínimo configurado.", "VALIDATION", 400);
  }

  const requestId = params.requestId.trim().slice(0, 80);
  if (!requestId) {
    throw new LoyaltyError("Não foi possível concluir o resgate.", "VALIDATION", 400);
  }
  const idempotencyKey = redeemKey(params.userId, reward.id, requestId);

  const existing = await prisma.loyaltyTransaction.findUnique({
    where: { idempotencyKey },
    include: { account: true },
  });
  if (existing) {
    return { duplicated: true as const, account: existing.account, transaction: existing, couponCode: readCouponCode(existing.metadata) };
  }

  if (reward.maxRedemptionsPerUser != null) {
    const used = await prisma.loyaltyTransaction.count({
      where: {
        account: { userId: params.userId },
        type: "REDEEM",
        sourceType: "REWARD",
        sourceId: reward.id,
      },
    });
    if (used >= reward.maxRedemptionsPerUser) {
      throw new LoyaltyError("Você já resgatou esta recompensa o máximo permitido.", "LIMIT", 400);
    }
  }

  try {
    return await prisma.$transaction(async (tx) => {
      const raced = await tx.loyaltyTransaction.findUnique({
        where: { idempotencyKey },
        include: { account: true },
      });
      if (raced) {
        return { duplicated: true as const, account: raced.account, transaction: raced, couponCode: readCouponCode(raced.metadata) };
      }

      let account = await tx.loyaltyAccount.findUnique({ where: { userId: params.userId } });
      if (!account) {
        account = await tx.loyaltyAccount.create({ data: { userId: params.userId, updatedAt: new Date() } });
      }
      await tx.$executeRaw`SELECT id FROM "LoyaltyAccount" WHERE id = ${account.id} FOR UPDATE`;
      account = await tx.loyaltyAccount.findUniqueOrThrow({ where: { id: account.id } });

      if (account.pointsBalance < reward.pointsCost) {
        throw new LoyaltyError("Você não tem pontos suficientes para esta recompensa.", "INSUFFICIENT_POINTS", 400);
      }

      const couponCode = buildCouponCode(params.userId);
      const coupon = await tx.coupon.create({
        data: {
          code: couponCode,
          description: reward.title,
          discountType: reward.couponDiscountType,
          discountValue: reward.couponDiscountValue,
          minOrderCents: reward.minOrderCents,
          maxRedemptions: 1,
          isActive: true,
        },
      });
      const redemption = await tx.couponRedemption.create({
        data: {
          couponId: coupon.id,
          userId: params.userId,
        },
      });

      const debit = -Math.abs(reward.pointsCost);
      const transaction = await tx.loyaltyTransaction.create({
        data: {
          loyaltyAccountId: account.id,
          type: "REDEEM",
          points: debit,
          sourceType: "REWARD",
          sourceId: reward.id,
          description: reward.title,
          idempotencyKey,
          metadata: { couponId: coupon.id, couponCode, redemptionId: redemption.id },
        },
      });
      const updated = await tx.loyaltyAccount.update({
        where: { id: account.id },
        data: { pointsBalance: account.pointsBalance + debit },
      });
      return { duplicated: false as const, account: updated, transaction, couponCode };
    }, { timeout: 20_000 });
  } catch (e) {
    if (isUniqueConflict(e)) {
      const again = await prisma.loyaltyTransaction.findUnique({
        where: { idempotencyKey },
        include: { account: true },
      });
      if (again) {
        return { duplicated: true as const, account: again.account, transaction: again, couponCode: readCouponCode(again.metadata) };
      }
    }
    throw e;
  }
}

function buildCouponCode(userId: string) {
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `ECCO${userId.slice(-4).toUpperCase()}${rand}`;
}

function readCouponCode(metadata: Prisma.JsonValue | null | undefined): string | null {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) return null;
  const code = (metadata as Record<string, unknown>).couponCode;
  return typeof code === "string" ? code : null;
}

export async function adjustLoyaltyPoints(params: {
  userId: string;
  points: number;
  reason: string;
  adminId: string;
  requestId: string;
}) {
  const reason = params.reason.trim();
  if (reason.length < 8) {
    throw new LoyaltyError("Informe um motivo com pelo menos 8 caracteres.", "VALIDATION", 400);
  }
  if (!Number.isFinite(params.points) || params.points === 0) {
    throw new LoyaltyError("Pontos inválidos.", "VALIDATION", 400);
  }
  return applyLoyaltyTransaction({
    userId: params.userId,
    type: "ADJUSTMENT",
    points: params.points,
    sourceType: "ADMIN",
    sourceId: params.adminId,
    description: reason,
    idempotencyKey: adjustmentKey(params.userId, params.requestId),
    metadata: { adminId: params.adminId },
  });
}

export async function listMembershipPlans() {
  return prisma.membershipPlan.findMany({
    where: { isActive: true },
    include: { benefits: true },
    orderBy: { priceCents: "asc" },
  });
}

export async function listActiveRewards() {
  return prisma.loyaltyReward.findMany({
    where: { isActive: true },
    orderBy: { pointsCost: "asc" },
  });
}

export function summarizeExpiring(transactions: Array<{ type: LoyaltyTxnType; points: number; expiresAt: Date | null }>, now = new Date()) {
  const horizon = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  return transactions
    .filter((t) => t.type === "EARN" && t.points > 0 && t.expiresAt && t.expiresAt > now && t.expiresAt <= horizon)
    .reduce((s, t) => s + t.points, 0);
}

export type LoyaltyAccountDTO = Prisma.LoyaltyAccountGetPayload<{
  include: { transactions: true };
}>;
