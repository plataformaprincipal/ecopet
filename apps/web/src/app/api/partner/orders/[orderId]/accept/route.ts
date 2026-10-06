import { apiFailure, apiSuccess } from "@/lib/api-response";
import { requireActivePartner } from "@/lib/auth/require-auth";
import { handleChatRouteError } from "@/lib/messages/api-handler";
import { partnerAcceptOrder } from "@/lib/commerce-chat/order-lifecycle";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ orderId: string }> };

export async function POST(_request: Request, context: RouteContext) {
  try {
    const { user, error } = await requireActivePartner();
    if (error) return error;
    const { orderId } = await context.params;
    const order = await partnerAcceptOrder({ orderId, partnerId: user!.id });
    return apiSuccess({ order });
  } catch (e) {
    return handleChatRouteError(e);
  }
}
