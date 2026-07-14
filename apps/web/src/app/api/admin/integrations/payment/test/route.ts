import { runAdminSmokeTest } from "@/lib/integrations/run-admin-smoke-test";
import {
  smokeTestPayment,
  type PaymentSmokeProvider,
} from "@/lib/integrations/integration-smoke-tests";

/** POST /api/admin/integrations/payment/test
 * Body opcional: `{ "provider": "mercado_pago" | "stripe" }`
 * Sem body: testa ambos.
 */
export async function POST(request: Request) {
  let provider: PaymentSmokeProvider | "all" = "all";
  try {
    const body = (await request.json()) as { provider?: string };
    if (body?.provider === "mercado_pago" || body?.provider === "stripe") {
      provider = body.provider;
    }
  } catch {
    /* body vazio / inválido → testa ambos */
  }

  return runAdminSmokeTest("/api/admin/integrations/payment/test", (actorId) =>
    smokeTestPayment(actorId, provider)
  );
}
