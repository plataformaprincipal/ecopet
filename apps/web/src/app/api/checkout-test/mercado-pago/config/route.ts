import { apiFailure, apiSuccess } from "@/lib/api-response";
import { requireAuth } from "@/lib/auth/require-auth";
import {
  getMercadoPagoTestCheckoutBlock,
  getMercadoPagoTestPublicConfig,
} from "@/lib/mercado-pago/test-credentials";

export const dynamic = "force-dynamic";

/** GET — Public Key TEST apenas. Nunca Access Token. Sem fallback LIVE. */
export async function GET() {
  const { error } = await requireAuth();
  if (error) return error;

  const block = getMercadoPagoTestCheckoutBlock();
  if (block) {
    return apiFailure(block.code, block.message, 503);
  }

  const publicConfig = getMercadoPagoTestPublicConfig();

  return apiSuccess({
    publicKey: publicConfig.publicKey,
    environment: publicConfig.environment,
    apiOrders: true,
    status: "TEST_ISOLATED",
  });
}
