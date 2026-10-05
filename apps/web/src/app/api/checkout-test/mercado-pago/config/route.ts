import { checkCheckoutTestRateLimit } from "@/lib/mercado-pago/checkout-test-rate-limit";
import { apiFailure, apiSuccess } from "@/lib/api-response";
import { requireAuth } from "@/lib/auth/guards";
import { getMercadoPagoTestPublicConfig } from "@/lib/mercado-pago/test-credentials";

export const dynamic = "force-dynamic";

/** GET — Public Key TEST apenas. Nunca Access Token. Sem fallback LIVE. */
export async function GET() {
  const { user, error } = await requireAuth();
  if (error) return error;
  if (!(await checkCheckoutTestRateLimit(`checkout-test:config:${user!.id}`, 12, 60_000))) {
    return apiFailure("RATE_LIMIT", "Muitas consultas de teste. Aguarde.", 429);
  }

  const publicConfig = getMercadoPagoTestPublicConfig();

  if (!publicConfig.configured) {
    return apiFailure(
      "MP_TEST_NOT_CONFIGURED",
      "Checkout de teste bloqueado: defina MERCADO_PAGO_TEST_ACCESS_TOKEN e NEXT_PUBLIC_MERCADO_PAGO_TEST_PUBLIC_KEY (credenciais TEST, sem fallback LIVE).",
      503
    );
  }

  return apiSuccess({
    publicKey: publicConfig.publicKey,
    environment: publicConfig.environment,
    apiOrders: true,
    status: "TEST_ISOLATED",
  });
}
