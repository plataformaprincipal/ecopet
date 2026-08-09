/**
 * Kill switch de checkout (independente de PAYOUTS_ENABLED).
 * CHECKOUT_ENABLED=false → bloqueia novos checkouts e novas cobranças MP.
 * Pedidos existentes, ledger, refunds e reconciliação permanecem.
 *
 * Default: true (exceto valor inválido explícito → fail-closed false).
 */
type EnvLike = Record<string, string | undefined>;

export function isCheckoutEnabled(env: EnvLike = process.env): boolean {
  const raw = env.CHECKOUT_ENABLED;
  if (raw === undefined || raw === "") return true;
  const v = String(raw).trim().toLowerCase();
  if (v === "1" || v === "true" || v === "yes" || v === "on") return true;
  if (v === "0" || v === "false" || v === "no" || v === "off") return false;
  // Configuração inválida → fail-closed (bloqueia novos checkouts)
  return false;
}

export class CheckoutDisabledError extends Error {
  constructor() {
    super("CHECKOUT_DISABLED");
    this.name = "CheckoutDisabledError";
  }
}

export function assertCheckoutEnabled(env: EnvLike = process.env): void {
  if (!isCheckoutEnabled(env)) {
    throw new CheckoutDisabledError();
  }
}
