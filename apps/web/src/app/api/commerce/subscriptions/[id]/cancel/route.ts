import { z } from "zod";
import { apiFailure, apiSuccess } from "@/lib/api-response";
import { requireAuth } from "@/lib/auth/require-auth";
import { cancelCatalogSubscription } from "@/lib/commerce-catalog/subscriptions";
import { CatalogCommerceError } from "@/lib/commerce-catalog/checkout";

export const dynamic = "force-dynamic";

const bodySchema = z.object({ reason: z.string().max(240).optional() });

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { user, error } = await requireAuth();
  if (error) return error;
  const { id } = await context.params;
  const parsed = bodySchema.safeParse(await request.json().catch(() => ({})));
  try {
    const sub = await cancelCatalogSubscription({
      userId: user!.id,
      subscriptionId: id,
      reason: parsed.success ? parsed.data.reason : undefined,
    });
    return apiSuccess({ subscription: sub, historyPreserved: true });
  } catch (e) {
    if (e instanceof CatalogCommerceError) return apiFailure(e.code, e.message, e.status);
    return apiFailure("ERROR", "Falha ao cancelar.", 500);
  }
}
