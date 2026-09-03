import { apiSuccess } from "@/lib/api-response";
import { requireAuth } from "@/lib/auth/require-auth";
import { listUserEntitlements } from "@/lib/commerce-catalog/subscriptions";

export const dynamic = "force-dynamic";

export async function GET() {
  const { user, error } = await requireAuth();
  if (error) return error;
  const entitlements = await listUserEntitlements(user!.id);
  return apiSuccess({ entitlements });
}
