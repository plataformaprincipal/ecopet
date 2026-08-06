/**
 * Simulated payment IDs (`sim_*`) are allowed only outside production and with
 * an explicit opt-in flag. Production (and Vercel production) always rejects them.
 */

export function isProductionPaymentEnvironment(
  env: NodeJS.ProcessEnv = process.env
): boolean {
  return env.NODE_ENV === "production" || env.VERCEL_ENV === "production";
}

export function isSimulatedPaymentId(id: string | null | undefined): boolean {
  return typeof id === "string" && id.startsWith("sim_");
}

/** True only when non-production AND ALLOW_SIMULATED_PAYMENTS=true|1. */
export function isSimulatedPaymentAllowed(
  env: NodeJS.ProcessEnv = process.env
): boolean {
  if (isProductionPaymentEnvironment(env)) return false;
  const flag = env.ALLOW_SIMULATED_PAYMENTS?.trim().toLowerCase();
  return flag === "true" || flag === "1";
}

export type SimulatedPaymentGuardResult =
  | { ok: true }
  | { ok: false; code: "SIMULATED_PAYMENT_FORBIDDEN"; reason: string };

export function assertSimulatedPaymentAllowed(
  paymentId: string | null | undefined,
  env: NodeJS.ProcessEnv = process.env
): SimulatedPaymentGuardResult {
  if (!isSimulatedPaymentId(paymentId)) {
    return { ok: true };
  }
  if (isSimulatedPaymentAllowed(env)) {
    return { ok: true };
  }
  return {
    ok: false,
    code: "SIMULATED_PAYMENT_FORBIDDEN",
    reason: isProductionPaymentEnvironment(env)
      ? "Identificador simulado não pode confirmar pagamento em produção"
      : "Defina ALLOW_SIMULATED_PAYMENTS=true para permitir sim_* fora de produção",
  };
}
