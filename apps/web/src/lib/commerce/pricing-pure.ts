/**
 * Cálculo de precificação sem I/O (testável sem server-only/prisma).
 *
 * Classificação de fallback:
 * - test fallback: usado por `pricing.test.ts` para regressão de aritmética isolada.
 * - migration compatibility: NÃO usar em checkout; o motor oficial é `@/lib/pricing`.
 * - production forbidden: nunca cobrir pedido/agendamento. Políticas divergem (sem booking fee oficial).
 *
 * Fonte de cobrança: Pricing Engine + PricingVersion ACTIVE.
 */
export type PricingSettings = {
  pricingVersion: string;
  platformFeePercent: number;
  platformFixedFee: number;
};

export type LineInput = {
  unitPrice: number;
  quantity: number;
};

export type LinePricing = {
  unitPrice: number;
  quantity: number;
  grossAmount: number;
  platformFeeAmount: number;
  partnerAmount: number;
  pricingVersion: string;
};

export type OrderPricing = {
  pricingVersion: string;
  platformFeePercent: number;
  platformFixedFee: number;
  grossAmount: number;
  platformFeeAmount: number;
  partnerAmount: number;
  lines: LinePricing[];
};

function roundMoney(n: number): number {
  return Math.round(n * 100) / 100;
}

export function calculateLinePricing(line: LineInput, settings: PricingSettings): LinePricing {
  if (!Number.isFinite(line.unitPrice) || line.unitPrice < 0) {
    throw new Error("INVALID_UNIT_PRICE");
  }
  if (!Number.isInteger(line.quantity) || line.quantity <= 0) {
    throw new Error("INVALID_QUANTITY");
  }
  const grossAmount = roundMoney(line.unitPrice * line.quantity);
  const percentFee = roundMoney((grossAmount * settings.platformFeePercent) / 100);
  const platformFeeAmount = roundMoney(percentFee);
  const partnerAmount = roundMoney(Math.max(0, grossAmount - platformFeeAmount));
  return {
    unitPrice: line.unitPrice,
    quantity: line.quantity,
    grossAmount,
    platformFeeAmount,
    partnerAmount,
    pricingVersion: settings.pricingVersion,
  };
}

export function calculateOrderPricing(lines: LineInput[], settings: PricingSettings): OrderPricing {
  const priced = lines.map((l) => calculateLinePricing(l, settings));
  const grossAmount = roundMoney(priced.reduce((s, l) => s + l.grossAmount, 0));
  const linesFee = roundMoney(priced.reduce((s, l) => s + l.platformFeeAmount, 0));
  const platformFeeAmount = roundMoney(linesFee + Math.max(0, settings.platformFixedFee));
  const partnerAmount = roundMoney(Math.max(0, grossAmount - platformFeeAmount));
  return {
    pricingVersion: settings.pricingVersion,
    platformFeePercent: settings.platformFeePercent,
    platformFixedFee: settings.platformFixedFee,
    grossAmount,
    platformFeeAmount,
    partnerAmount,
    lines: priced,
  };
}
