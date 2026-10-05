import { apiFailure, apiSuccess } from "@/lib/api-response";
import { requireAuth } from "@/lib/auth/require-auth";
import { checkRateLimit } from "@/lib/rate-limit";
import { getMercadoPagoCheckoutTestOrderForUser } from "@/lib/mercado-pago/create-checkout-test-order";
import { isMercadoPagoTestCheckoutConfigured } from "@/lib/mercado-pago/test-credentials";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

/** GET /api/checkout-test/mercado-pago/order/[id] — consulta TEST only. */
export async function GET(request: Request, context: Ctx) {
  const { user, error } = await requireAuth();
  if (error) return error;

  if (!isMercadoPagoTestCheckoutConfigured()) {
    return apiFailure("MP_TEST_NOT_CONFIGURED", "Checkout de teste indisponível.", 503);
  }

  if (!checkRateLimit(`mp-test-order-get:${user!.id}`, 30, 60_000)) {
    return apiFailure("RATE_LIMIT", "Muitas consultas. Aguarde.", 429);
  }

  const { id } = await context.params;
  if (!id || id.length > 80) {
    return apiFailure("VALIDATION", "Identificador inválido.", 400);
  }

  const url = new URL(request.url);
  const as = url.searchParams.get("as");

  try {
    const result = await getMercadoPagoCheckoutTestOrderForUser({
      userId: user!.id,
      ...(as === "provider"
        ? { providerOrderId: id }
        : as === "order"
          ? { orderId: id }
          : { paymentId: id }),
    });
    return apiSuccess(result);
  } catch (e) {
    const code = e instanceof Error ? e.message : "INTERNAL";
    if (code === "ORDER_FORBIDDEN" || code === "ORDER_NOT_TEST") {
      return apiFailure("FORBIDDEN", "Acesso negado.", 403);
    }
    return apiFailure("INTERNAL", "Erro ao consultar pagamento de teste.", 500);
  }
}
