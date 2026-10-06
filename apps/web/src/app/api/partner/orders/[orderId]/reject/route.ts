import { z } from "zod";
import { apiFailure, apiSuccess } from "@/lib/api-response";
import { requireActivePartner } from "@/lib/auth/require-auth";
import { handleChatRouteError } from "@/lib/messages/api-handler";
import { partnerRejectOrder } from "@/lib/commerce-chat/order-lifecycle";
import { SELLER_REJECT_REASONS, SELLER_REJECT_REASON_LABEL } from "@/lib/commerce/ops-policy";

export const dynamic = "force-dynamic";

const schema = z.object({
  reason: z.enum(SELLER_REJECT_REASONS),
  details: z.string().max(500).optional(),
});

type RouteContext = { params: Promise<{ orderId: string }> };

export async function POST(request: Request, context: RouteContext) {
  try {
    const { user, error } = await requireActivePartner();
    if (error) return error;
    const { orderId } = await context.params;
    const parsed = schema.safeParse(await request.json().catch(() => ({})));
    if (!parsed.success) return apiFailure("VALIDATION", "Selecione um motivo para recusar o pedido.", 400);
    const label = SELLER_REJECT_REASON_LABEL[parsed.data.reason];
    const result = await partnerRejectOrder({
      orderId,
      partnerId: user!.id,
      reason: parsed.data.details ? `${label}: ${parsed.data.details}` : label,
    });
    return apiSuccess(result);
  } catch (e) {
    return handleChatRouteError(e);
  }
}
