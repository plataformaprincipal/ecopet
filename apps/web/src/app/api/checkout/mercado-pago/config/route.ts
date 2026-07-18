import { apiFailure, apiSuccess } from "@/lib/api-response";
import { requireClient } from "@/lib/auth/require-auth";
import { getMercadoPagoPublicConfig, getMercadoPagoSanitizedStatus } from "@/lib/mercado-pago/config";

export const dynamic = "force-dynamic";

/** GET — Public Key + status sanitizado (nunca Access Token). */
export async function GET() {
  const { error } = await requireClient();
  if (error) return error;

  const publicConfig = getMercadoPagoPublicConfig();
  const status = getMercadoPagoSanitizedStatus();

  if (!publicConfig.configured) {
    return apiFailure(
      "NOT_CONFIGURED",
      `Checkout Mercado Pago indisponível (${status.status}).`,
      503
    );
  }

  return apiSuccess({
    publicKey: publicConfig.publicKey,
    environment: publicConfig.environment,
    apiOrders: true,
    status: status.status,
  });
}
