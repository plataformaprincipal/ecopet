import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { DEFAULT_LOYALTY_POLICY, computeEarnPoints } from "./rules";

export async function getOrCreateLoyaltyPolicy() {
  const existing = await prisma.loyaltyPolicy.findUnique({ where: { id: "singleton" } });
  if (existing) return existing;
  return prisma.loyaltyPolicy.create({
    data: {
      id: "singleton",
      enabled: DEFAULT_LOYALTY_POLICY.enabled,
      pointsPerBrl: DEFAULT_LOYALTY_POLICY.pointsPerBrl,
      servicePointsPerBrl: DEFAULT_LOYALTY_POLICY.servicePointsPerBrl,
      expirationDays: DEFAULT_LOYALTY_POLICY.expirationDays,
      maxEarnPerEvent: DEFAULT_LOYALTY_POLICY.maxEarnPerEvent,
      minRedeemPoints: DEFAULT_LOYALTY_POLICY.minRedeemPoints,
      referralEnabled: DEFAULT_LOYALTY_POLICY.referralEnabled,
      overdraftPolicy: DEFAULT_LOYALTY_POLICY.overdraftPolicy,
    },
  });
}

export async function resolveEarnMultiplier(input: {
  userId: string;
  sourceType: "ORDER" | "SERVICE";
  category?: string | null;
  now?: Date;
}): Promise<number> {
  const now = input.now ?? new Date();
  const campaigns = await prisma.loyaltyCampaign.findMany({
    where: {
      isActive: true,
      startsAt: { lte: now },
      endsAt: { gte: now },
      OR: [{ sourceType: null }, { sourceType: input.sourceType }],
    },
  });
  let multiplier = 1;
  for (const c of campaigns) {
    if (c.category && input.category && c.category !== input.category) continue;
    if (c.category && !input.category) continue;
    if (c.multiplier > multiplier) multiplier = c.multiplier;
  }

  const sub = await prisma.membershipSubscription.findFirst({
    where: { userId: input.userId, status: "ACTIVE" },
    include: { plan: true },
  });
  const raw = sub?.plan.benefitsJson;
  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    const value = (raw as Record<string, unknown>).pointsMultiplier;
    if (typeof value === "number" && Number.isFinite(value) && value > 0) {
      multiplier *= value;
    }
  }
  return multiplier;
}

export function pointsForOrderAmount(amountBrl: number, policy: { pointsPerBrl: number; maxEarnPerEvent: number | null }, multiplier = 1) {
  return computeEarnPoints({
    amountBrl,
    pointsPerBrl: policy.pointsPerBrl,
    multiplier,
    maxEarnPerEvent: policy.maxEarnPerEvent,
  });
}

export function pointsForServiceAmount(amountBrl: number, policy: { servicePointsPerBrl: number; maxEarnPerEvent: number | null }, multiplier = 1) {
  return computeEarnPoints({
    amountBrl,
    pointsPerBrl: policy.servicePointsPerBrl,
    multiplier,
    maxEarnPerEvent: policy.maxEarnPerEvent,
  });
}

export async function activeCampaigns(now = new Date()) {
  return prisma.loyaltyCampaign.findMany({
    where: { isActive: true, startsAt: { lte: now }, endsAt: { gte: now } },
    orderBy: { startsAt: "desc" },
  });
}

export type LoyaltyPolicyRow = Prisma.LoyaltyPolicyGetPayload<object>;
