import { apiFailure, apiSuccess } from "@/lib/api-response";
import { requireAuth } from "@/lib/auth/require-auth";
import { listUserSubscriptions } from "@/lib/commerce-catalog/subscriptions";
import { creditBalanceCents } from "@/lib/commerce-catalog/credits";

export const dynamic = "force-dynamic";

export async function GET() {
  const { user, error } = await requireAuth();
  if (error) return error;
  const [subscriptions, creditCents] = await Promise.all([
    listUserSubscriptions(user!.id),
    creditBalanceCents(user!.id),
  ]);
  return apiSuccess({ subscriptions, creditCents, creditWithdrawable: false });
}
