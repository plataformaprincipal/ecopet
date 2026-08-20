/**
 * Política de fallback de Pricing.
 *
 * production forbidden: memória e pricing-pure NÃO podem mascarar schema/versão ausentes.
 * test fallback: NODE_ENV=test (engine unitário sem banco).
 * dev fallback: PRICING_MEMORY_FALLBACK=true ou ambiente não-produção, só para bootstrap/admin preview.
 * checkout de cobrança: sempre exige PricingVersion ACTIVE no banco.
 */

export type PricingFallbackClass =
  | "test fallback"
  | "dev fallback"
  | "migration compatibility"
  | "production forbidden";

export function isProductionPricingContext(env: Record<string, string | undefined> = process.env): boolean {
  if (env.VERCEL_ENV === "production") return true;
  if (env.NODE_ENV === "production" && env.VERCEL_ENV !== "preview") return true;
  return false;
}

export function isPricingMemoryFallbackAllowed(env: Record<string, string | undefined> = process.env): boolean {
  if (isProductionPricingContext(env)) return false;
  const flag = env.PRICING_MEMORY_FALLBACK?.trim().toLowerCase();
  if (flag === "0" || flag === "false" || flag === "off") return false;
  if (env.NODE_ENV === "test") return true;
  if (flag === "1" || flag === "true" || flag === "yes" || flag === "on") return true;
  return env.NODE_ENV !== "production";
}

/** Checkout/agendamento cobrável nunca usa memória nem pricing legado. */
export function isChargingMemoryFallbackAllowed(env: Record<string, string | undefined> = process.env): boolean {
  if (isProductionPricingContext(env)) return false;
  return env.NODE_ENV === "test";
}

export function classifyPricingFallback(env: Record<string, string | undefined> = process.env): PricingFallbackClass {
  if (isProductionPricingContext(env)) return "production forbidden";
  if (env.NODE_ENV === "test") return "test fallback";
  if (env.PRICING_MEMORY_FALLBACK === "true") return "dev fallback";
  if (env.NODE_ENV !== "production") return "migration compatibility";
  return "production forbidden";
}
