import { z } from "zod";
import { apiFailure, apiSuccess } from "@/lib/api-response";
import { requireAuth } from "@/lib/auth/require-auth";
import { checkoutAiFromCart } from "@/lib/ai-commerce/checkout-service";
import { enforceAiCommerceRateLimit, handleAiCommerceError } from "@/lib/ai-commerce/http";
import { CouponError } from "@/lib/commerce/apply-coupon";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  couponCode: z.string().max(40).optional().nullable(),
});

export async function POST(request: Request) {
  const { user, error } = await requireAuth();
  if (error) return error;
  const limited = await enforceAiCommerceRateLimit(`ai-checkout:${user!.id}`, 8);
  if (limited) return limited;

  const parsed = bodySchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return apiFailure("VALIDATION", "Dados inválidos.", 400);

  const idempotencyKey = request.headers.get("Idempotency-Key")?.slice(0, 80) ?? null;
  try {
    const order = await checkoutAiFromCart({
      userId: user!.id,
      idempotencyKey,
      couponCode: parsed.data.couponCode,
    });
    return apiSuccess({
      orderId: order.id,
      orderNumber: order.orderNumber,
      total: order.total,
      currency: order.currency,
      status: order.status,
      items: order.items.map((i) => ({
        name: i.name,
        sku: i.sku,
        petId: i.petId,
        quantity: i.quantity,
        price: i.price,
      })),
    });
  } catch (e) {
    if (e instanceof CouponError) return apiFailure(e.code, e.message, e.status);
    return handleAiCommerceError(e);
  }
}
