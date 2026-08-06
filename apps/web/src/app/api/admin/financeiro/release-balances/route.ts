import { apiError, apiSuccess } from "@/lib/api-response";
import { requireAdmin } from "@/lib/auth/guards";
import { releaseEligiblePartnerBalances } from "@/lib/finance/reserve";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const { user, error } = await requireAdmin({ path: "/api/admin/financeiro/release-balances" });
  if (error) return error;

  const body = await req.json().catch(() => ({}));
  const result = await releaseEligiblePartnerBalances({
    partnerId: typeof body.partnerId === "string" ? body.partnerId : undefined,
    orderId: typeof body.orderId === "string" ? body.orderId : undefined,
    actorId: user!.id,
  });
  return apiSuccess(result);
}
