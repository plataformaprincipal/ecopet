import { z } from "zod";
import { apiSuccess, apiFailure } from "@/lib/api-response";
import { requireClient } from "@/lib/auth/require-auth";
import { getOrCreateCart } from "@/lib/cart/cart-service";
import { CouponError, previewCouponForUser } from "@/lib/commerce/apply-coupon";

const bodySchema = z.object({
  code: z.string().trim().min(3).max(40),
});

export async function POST(request: Request) {
  const { user, error } = await requireClient();
  if (error) return error;

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return apiFailure("VALIDATION", "Informe o cupom.", 400);

  const cart = await getOrCreateCart(user!.id);
  const grossBrl = cart.items.reduce((s, i) => s + i.product.price * i.quantity, 0);

  try {
    const preview = await previewCouponForUser({
      userId: user!.id,
      code: parsed.data.code,
      grossBrl,
    });
    return apiSuccess(preview);
  } catch (e) {
    if (e instanceof CouponError) {
      return apiFailure(e.code, e.message, e.status);
    }
    console.error("[coupon:preview]", e);
    return apiFailure("INTERNAL", "Não foi possível validar o cupom.", 500);
  }
}
