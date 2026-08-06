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
 * Origens autorizadas a confirmar PAID/APPROVED (Fase 2).
 * - webhook: confirmação assíncrona validada (fonte oficial)
 * - poll: reconciliação server-side consultando o gateway (não o browser)
 * createPayment (source=api) NÃO pode marcar PAID — aguarda webhook.
 * Frontend / partner NUNCA podem marcar PAID.
 */
export const AUTHORIZED_PAID_SOURCES = ["webhook", "poll"] as const;
export type AuthorizedPaidSource = (typeof AUTHORIZED_PAID_SOURCES)[number];

export function isAuthorizedPaidSource(source: string): source is AuthorizedPaidSource {
  return (AUTHORIZED_PAID_SOURCES as readonly string[]).includes(source);
}
