import { z } from "zod";
import { apiFailure, apiSuccess } from "@/lib/api-response";
import { requireClient } from "@/lib/auth/require-auth";
import { requestClientRefund } from "@/lib/mercado-pago/refunds";
import { checkAuthRateLimit, clientIp } from "@/lib/rate-limit";

const schema = z.object({
  reason: z.string().min(5).max(500),
  amount: z.number().positive().optional(),
});

/** POST — cliente solicita estorno (não chama MP até aprovação admin). */
export async function POST(
  request: Request,
  context: { params: Promise<{ orderId: string }> }
) {
  const { user, error } = await requireClient();
  if (error) return error;

  const ip = clientIp(request);
  if (!checkAuthRateLimit(`refund-req:${user!.id}:${ip}`, 10, 60 * 60 * 1000)) {
    return apiFailure("RATE_LIMIT", "Muitas solicitações. Aguarde.", 429);
  }

  const { orderId } = await context.params;
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return apiFailure("VALIDATION", "Dados inválidos.", 400);

  const result = await requestClientRefund({
    orderId,
    userId: user!.id,
    reason: parsed.data.reason,
    amount: parsed.data.amount,
  });

  if (!result.ok) return apiFailure(result.code, result.message, 400);
  return apiSuccess(result);
}
