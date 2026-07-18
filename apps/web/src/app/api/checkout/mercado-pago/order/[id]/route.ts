import { apiFailure, apiSuccess } from "@/lib/api-response";
import { requireClient } from "@/lib/auth/require-auth";
import { checkRateLimit } from "@/lib/rate-limit";
import { getMercadoPagoCheckoutOrderForUser } from "@/lib/mercado-pago/create-checkout-order";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

/** GET /api/checkout/mercado-pago/order/[id] — id = paymentId ou providerOrderId. */
export async function GET(request: Request, context: Ctx) {
  const { user, error } = await requireClient();
  if (error) return error;

  if (!checkRateLimit(`mp-order-get:${user!.id}`, 30, 60_000)) {
    return apiFailure("RATE_LIMIT", "Muitas consultas. Aguarde.", 429);
  }

  const { id } = await context.params;
  if (!id || id.length > 80) {
    return apiFailure("VALIDATION", "Identificador inválido.", 400);
  }

  const url = new URL(request.url);
  const asProvider = url.searchParams.get("as") === "provider";

  try {
    const result = await getMercadoPagoCheckoutOrderForUser({
      userId: user!.id,
      ...(asProvider ? { providerOrderId: id } : { paymentId: id }),
    });
    return apiSuccess(result);
  } catch (e) {
    const code = e instanceof Error ? e.message : "INTERNAL";
    if (code === "ORDER_FORBIDDEN") {
      return apiFailure("FORBIDDEN", "Acesso negado.", 403);
    }
    return apiFailure("INTERNAL", "Erro ao consultar pagamento.", 500);
  }
}
