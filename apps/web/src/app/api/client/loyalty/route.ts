import { apiSuccess, apiFailure } from "@/lib/api-response";
import { requireAuth } from "@/lib/auth/require-auth";
import {
  getOrCreateLoyaltyAccount,
  listMembershipPlans,
  LoyaltyError,
} from "@/lib/loyalty/service";

export async function GET() {
  try {
    const { user, error } = await requireAuth();
    if (error) return error;

    const [account, plans] = await Promise.all([
      getOrCreateLoyaltyAccount(user!.id),
      listMembershipPlans(),
    ]);

    return apiSuccess({
      programName: "EccoPontos",
      account: {
        id: account.id,
        pointsBalance: account.pointsBalance,
        lifetimePoints: account.lifetimePoints,
        tier: account.tier,
        updatedAt: account.updatedAt,
      },
      recentTransactions: account.transactions.map((tx) => ({
        id: tx.id,
        type: tx.type,
        points: tx.points,
        sourceType: tx.sourceType,
        sourceId: tx.sourceId,
        description: tx.description,
        createdAt: tx.createdAt,
      })),
      club: {
        name: "EccoPet Club",
        description: "Assinatura opcional com benefícios configuráveis — não obrigatória para usar o marketplace.",
        available: plans.length > 0,
        plans: plans.map((p) => ({
          id: p.id,
          code: p.code,
          name: p.name,
          description: p.description,
          priceCents: p.priceCents,
          currency: p.currency,
          interval: p.interval,
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
