import { apiSuccess, apiFailure } from "@/lib/api-response";
import { requireClient } from "@/lib/auth/require-auth";
import { prisma } from "@/lib/prisma";
import {
  getOrCreateLoyaltyAccount,
  listActiveRewards,
  listMembershipPlans,
  summarizeExpiring,
  LoyaltyError,
} from "@/lib/loyalty/service";
import { activeCampaigns, getOrCreateLoyaltyPolicy } from "@/lib/loyalty/policy";

export async function GET() {
  try {
    const { user, error } = await requireClient();
    if (error) return error;

    const [account, plans, policy, rewards, campaigns, coupons] = await Promise.all([
      getOrCreateLoyaltyAccount(user!.id),
      listMembershipPlans(),
      getOrCreateLoyaltyPolicy(),
      listActiveRewards(),
      activeCampaigns(),
      prisma.couponRedemption.findMany({
        where: { userId: user!.id },
        include: { coupon: true },
        orderBy: { createdAt: "desc" },
        take: 20,
      }),
    ]);

    const expiringPoints = summarizeExpiring(account.transactions);

    return apiSuccess({
      programName: "EccoPontos",
      account: {
        pointsBalance: account.pointsBalance,
        lifetimePoints: account.lifetimePoints,
        tier: account.tier,
        expiringPoints: policy.expirationDays ? expiringPoints : 0,
        pendingPoints: 0,
        updatedAt: account.updatedAt,
      },
      policy: {
        enabled: policy.enabled,
        pointsPerBrl: policy.pointsPerBrl,
        servicePointsPerBrl: policy.servicePointsPerBrl,
        expirationDays: policy.expirationDays,
        expirationPolicy: policy.expirationDays ? "days" : "none",
        referralEnabled: policy.referralEnabled,
        minRedeemPoints: policy.minRedeemPoints,
      },
      howToEarn: [
        { id: "order", enabled: policy.enabled, pointsPerBrl: policy.pointsPerBrl },
        { id: "service", enabled: policy.enabled, pointsPerBrl: policy.servicePointsPerBrl },
        { id: "referral", enabled: policy.referralEnabled },
      ],
      campaigns: campaigns.map((c) => ({
        id: c.id,
        name: c.name,
        multiplier: c.multiplier,
        endsAt: c.endsAt,
      })),
      rewards: rewards.map((r) => ({
        id: r.id,
        code: r.code,
        title: r.title,
        description: r.description,
        pointsCost: r.pointsCost,
      })),
      coupons: coupons
        .filter((c) => c.coupon.isActive)
        .map((c) => ({
          code: c.coupon.code,
          title: c.coupon.description,
          discountType: c.coupon.discountType,
          discountValue: c.coupon.discountValue,
        })),
      recentTransactions: account.transactions.map((tx) => ({
        id: tx.id,
        type: tx.type,
        points: tx.points,
        sourceType: tx.sourceType,
        description: tx.description,
        createdAt: tx.createdAt,
        expiresAt: tx.expiresAt,
      })),
      club: {
        name: "EccoPet One",
        available: plans.length > 0,
        checkoutEnabled: false,
        plans: plans.map((p) => ({
          id: p.id,
          code: p.code,
          name: p.name,
          description: p.description,
          benefits: p.benefits.map((b) => ({
            code: b.code,
            title: b.title,
            description: b.description,
          })),
        })),
      },
    });
  } catch (e) {
    if (e instanceof LoyaltyError) {
      return apiFailure(e.code, e.message, e.status);
    }
    console.error("[loyalty]", e);
    return apiFailure("INTERNAL", "Não foi possível carregar EccoPontos.", 500);
  }
}
