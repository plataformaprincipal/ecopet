import { z } from "zod";
import { apiFailure, apiSuccess } from "@/lib/api-response";
import { requireActivePartner } from "@/lib/auth/require-auth";
import { handleChatRouteError } from "@/lib/messages/api-handler";
import { partnerRejectOrder } from "@/lib/commerce-chat/order-lifecycle";

export const dynamic = "force-dynamic";

const schema = z.object({
  reason: z.string().max(500).optional(),
});

type RouteContext = { params: Promise<{ orderId: string }> };

export async function POST(request: Request, context: RouteContext) {
  try {
    const { user, error } = await requireActivePartner();
    if (error) return error;
    const { orderId } = await context.params;
    const parsed = schema.safeParse(await request.json().catch(() => ({})));
    if (!parsed.success) return apiFailure("VALIDATION", "Dados inválidos.", 400);
    const result = await partnerRejectOrder({
      orderId,
      partnerId: user!.id,
      reason: parsed.data.reason,
    });
    return apiSuccess(result);
  } catch (e) {
    return handleChatRouteError(e);
  }
}
