import { z } from "zod";
import { apiFailure, apiSuccess } from "@/lib/api-response";
import { requireAuth } from "@/lib/auth/require-auth";
import { CatalogCommerceError, checkoutCatalogSku } from "@/lib/commerce-catalog/checkout";
import { CheckoutDisabledError } from "@/lib/commerce/checkout-flags";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  sku: z.string().min(3).max(40),
  petId: z.string().min(1).optional().nullable(),
  billingCycle: z.enum(["month", "year"]).optional(),
  urgent: z.boolean().optional(),
  caseId: z.string().min(1).optional().nullable(),
});

export async function POST(request: Request) {
  const { user, error } = await requireAuth();
  if (error) return error;
  const parsed = bodySchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return apiFailure("VALIDATION", "SKU inválido.", 400);
  const idempotencyKey = request.headers.get("Idempotency-Key")?.slice(0, 80) ?? null;
  try {
    const result = await checkoutCatalogSku({
      userId: user!.id,
      sku: parsed.data.sku,
      petId: parsed.data.petId,
      billingCycle: parsed.data.billingCycle,
      urgent: parsed.data.urgent,
      caseId: parsed.data.caseId,
      idempotencyKey,
      role: user!.role,
    });
    return apiSuccess({
      orderId: result.order.id,
      total: result.order.total,
      status: result.order.status,
      free: result.free,
      sku: parsed.data.sku,
    });
  } catch (e) {
    if (e instanceof CheckoutDisabledError) return apiFailure("CHECKOUT_DISABLED", "Checkout temporariamente desligado.", 409);
    if (e instanceof CatalogCommerceError) return apiFailure(e.code, e.message, e.status);
    return apiFailure("ERROR", "Não foi possível iniciar o checkout.", 500);
  }
}
