import { apiFailure, apiSuccess } from "@/lib/api-response";
import { requireClient } from "@/lib/auth/require-auth";
import { invalidateUnpaidCheckoutSession, loadCheckoutSession } from "@/lib/orders/checkout-session";

type RouteContext = { params: Promise<{ sessionId: string }> };

export async function GET(_req: Request, context: RouteContext) {
  const { user, error } = await requireClient();
  if (error) return error;
  const { sessionId } = await context.params;
  if (!sessionId) return apiFailure("VALIDATION", "Sessão inválida.", 400);
  const session = await loadCheckoutSession(user!.id, sessionId);
  return apiSuccess(session);
}

export async function DELETE(_req: Request, context: RouteContext) {
  const { user, error } = await requireClient();
  if (error) return error;
  const { sessionId } = await context.params;
  if (!sessionId) return apiFailure("VALIDATION", "Sessão inválida.", 400);
  const result = await invalidateUnpaidCheckoutSession(user!.id, sessionId);
  return apiSuccess(result);
}
