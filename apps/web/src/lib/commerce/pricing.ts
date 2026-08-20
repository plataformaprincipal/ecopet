/**
 * Precificação comercial (Fase 2) + parâmetros financeiros provisórios (Fase 3).
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

export type FinancialPricingSettings = PricingSettings & {
  gatewayFeePercent: number;
  reservePercent: number;
  taxEstimatePercent: number;
  gatewayFeeBearer: "PARTNER" | "PLATFORM";
  reserveHoldDays: number;
};

const DEFAULTS: FinancialPricingSettings = {
  pricingVersion: "BR-2026.08-v1",
  platformFeePercent: 10,
  platformFixedFee: 1.49,
  gatewayFeePercent: 3,
  reservePercent: 1.5,
  taxEstimatePercent: 12,
  gatewayFeeBearer: "PARTNER",
  reserveHoldDays: 14,
};

export async function loadPricingSettings(): Promise<FinancialPricingSettings> {
  const row = await prisma.platformSettings.findUnique({ where: { id: "singleton" } });
  if (!row) return { ...DEFAULTS };
  return {
    pricingVersion: row.pricingVersion || DEFAULTS.pricingVersion,
    platformFeePercent:
      typeof row.platformFeePercent === "number" ? row.platformFeePercent : DEFAULTS.platformFeePercent,
    platformFixedFee:
      typeof row.platformFixedFee === "number" ? row.platformFixedFee : DEFAULTS.platformFixedFee,
    gatewayFeePercent:
      typeof (row as { gatewayFeePercent?: number }).gatewayFeePercent === "number"
        ? (row as { gatewayFeePercent: number }).gatewayFeePercent
        : DEFAULTS.gatewayFeePercent,
    reservePercent:
      typeof (row as { reservePercent?: number }).reservePercent === "number"
        ? (row as { reservePercent: number }).reservePercent
        : DEFAULTS.reservePercent,
    taxEstimatePercent:
      typeof (row as { taxEstimatePercent?: number }).taxEstimatePercent === "number"
        ? (row as { taxEstimatePercent: number }).taxEstimatePercent
        : DEFAULTS.taxEstimatePercent,
    gatewayFeeBearer:
      (row as { gatewayFeeBearer?: string }).gatewayFeeBearer === "PLATFORM" ? "PLATFORM" : "PARTNER",
    reserveHoldDays:
      typeof (row as { reserveHoldDays?: number }).reserveHoldDays === "number"
        ? (row as { reserveHoldDays: number }).reserveHoldDays
        : DEFAULTS.reserveHoldDays,
  };
}

export function assertPositiveMoney(amount: number, code = "INVALID_AMOUNT") {
  if (!Number.isFinite(amount) || amount < 0) throw new Error(code);
}
