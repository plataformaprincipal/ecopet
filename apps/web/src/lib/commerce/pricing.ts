/**
 * Precificação comercial mínima (Fase 2).
 * Valores são contábeis/esperados — NÃO representam split ou repasse automático.
 */
import "server-only";
import { prisma } from "@/lib/prisma";
import {
  calculateLinePricing,
  calculateOrderPricing,
  type PricingSettings,
  type LineInput,
  type LinePricing,
  type OrderPricing,
} from "./pricing-pure";

export type { PricingSettings, LineInput, LinePricing, OrderPricing };
export { calculateLinePricing, calculateOrderPricing };

const DEFAULTS: PricingSettings = {
  pricingVersion: "v1",
  platformFeePercent: 10,
  platformFixedFee: 0,
};

export async function loadPricingSettings(): Promise<PricingSettings> {
  const row = await prisma.platformSettings.findUnique({ where: { id: "singleton" } });
  if (!row) return { ...DEFAULTS };
  return {
    pricingVersion: row.pricingVersion || DEFAULTS.pricingVersion,
    platformFeePercent:
      typeof row.platformFeePercent === "number" ? row.platformFeePercent : DEFAULTS.platformFeePercent,
    platformFixedFee:
      typeof row.platformFixedFee === "number" ? row.platformFixedFee : DEFAULTS.platformFixedFee,
  };
}

export function assertPositiveMoney(amount: number, code = "INVALID_AMOUNT") {
  if (!Number.isFinite(amount) || amount < 0) throw new Error(code);
}
