import { z } from "zod";
import { apiSuccess, apiFailure } from "@/lib/api-response";
import { requireClient } from "@/lib/auth/require-auth";
import { LoyaltyError, redeemLoyaltyReward } from "@/lib/loyalty/service";

const bodySchema = z.object({
  rewardId: z.string().min(1),
  requestId: z.string().min(8).max(80),
});

export async function POST(request: Request) {
  try {
    const { user, error } = await requireClient();
    if (error) return error;

    const parsed = bodySchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return apiFailure("VALIDATION", "Não foi possível concluir o resgate.", 400);
    }

    const result = await redeemLoyaltyReward({
      userId: user!.id,
      rewardId: parsed.data.rewardId,
      requestId: parsed.data.requestId,
    });

    return apiSuccess({
      duplicated: result.duplicated,
      pointsBalance: result.account.pointsBalance,
      couponCode: result.couponCode,
    });
  } catch (e) {
    if (e instanceof LoyaltyError) {
      return apiFailure(e.code, e.message, e.status);
    }
    console.error("[loyalty:redeem]", e);
    return apiFailure("INTERNAL", "Não foi possível concluir o resgate.", 500);
  }
}
