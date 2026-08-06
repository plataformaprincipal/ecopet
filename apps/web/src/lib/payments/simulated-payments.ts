/**
 * Simulated payment IDs (`sim_*`) must never confirm payment in production.
 * Opt-in only via ALLOW_SIMULATED_PAYMENTS outside production.
 */

export function isProductionPaymentEnvironment(
  env: NodeJS.ProcessEnv | Record<string, string | undefined> = process.env
): boolean {
  return env.NODE_ENV === "production" || env.VERCEL_ENV === "production";
}

export function isSimulatedPaymentId(id: string | null | undefined): boolean {
  return typeof id === "string" && id.startsWith("sim_");
}

export function isSimulatedPaymentAllowed(
  env: NodeJS.ProcessEnv | Record<string, string | undefined> = process.env
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
  env: NodeJS.ProcessEnv | Record<string, string | undefined> = process.env
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

/**
 * Authorized origins that may transition an order/payment to paid/approved.
 * - webhook / poll: async confirmation
 * - api: server-side Mercado Pago create/get response (never client body)
 * - wallet: internal wallet debit
 * Frontend / partner order status routes must NOT call this path for PAID.
 */
export const AUTHORIZED_PAID_SOURCES = [
  "webhook",
  "poll",
  "api",
  "wallet",
  "admin_refund_reconcile",
] as const;
export type AuthorizedPaidSource = (typeof AUTHORIZED_PAID_SOURCES)[number];

export function isAuthorizedPaidSource(source: string): source is AuthorizedPaidSource {
  return (AUTHORIZED_PAID_SOURCES as readonly string[]).includes(source);
}
