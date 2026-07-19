import { apiFailure, apiSuccess } from "@/lib/api-response";
import { requireClient } from "@/lib/auth/require-auth";
import { getActiveCheckoutPaymentMethods } from "@/lib/mercado-pago/payment-methods";
import { isMercadoPagoConfigured } from "@/lib/mercado-pago/config";

export const dynamic = "force-dynamic";

export async function GET() {
  const { error } = await requireClient();
  if (error) return error;
  if (!isMercadoPagoConfigured()) {
    return apiFailure("MP_NOT_CONFIGURED", "Pagamentos online indisponíveis.", 503);
  }
  const methods = await getActiveCheckoutPaymentMethods();
  return apiSuccess({ methods });
}
