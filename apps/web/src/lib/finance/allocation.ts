/**
 * Split lógico interno a partir do snapshot do pedido.
 * NÃO recalcula com tabela vigente de PlatformSettings.
 *
 * Política provisória (documentada):
 * - gatewayFeeBearer PARTNER → taxa gateway reduz partnerPayable
 * - taxEstimate sobre receita da plataforma → NÃO reduz partnerPayable
 * - reserva deduzida do payable e bloqueada
 */

import { assertNonNegativeCents, percentOfCents, toCents, type MoneyCents } from "./money";

export type CommercialAllocationInput = {
  grossAmount: number;
  discountAmount?: number;
  platformPercentage: number;
  platformFixedFee: number;
  /** Se omitido, estimado via gatewayFeePercent sobre (gross - discount) */
  gatewayFeeEstimated?: number;
  gatewayFeePercent?: number;
  gatewayFeeBearer?: "PARTNER" | "PLATFORM";
  reservePercent?: number;
  /** Reserva absoluta opcional (override) */
  reserveAmount?: number;
  taxEstimatePercent?: number;
  /** Imposto absoluto opcional (override) */
  taxEstimate?: number;
  pricingVersion: string;
};

export type CommercialAllocation = {
  grossAmountCents: MoneyCents;
  discountAmountCents: MoneyCents;
  platformPercentage: number;
  platformPercentageAmountCents: MoneyCents;
  platformFixedFeeCents: MoneyCents;
  gatewayFeeEstimatedCents: MoneyCents;
  gatewayFeeBearer: "PARTNER" | "PLATFORM";
  reserveAmountCents: MoneyCents;
  taxEstimateCents: MoneyCents;
  /** Imposto NÃO entra na equação do parceiro (absorvido na receita plataforma). */
  taxReducesPartnerPayable: false;
  partnerPayableCents: MoneyCents;
  calculatedPartnerAmountCents: MoneyCents;
  pricingVersion: string;
  /** Campos Float para persistência no Order legado */
  asOrderFloats: {
    grossAmount: number;
    discountAmount: number;
    platformPercentage: number;
    platformFixedFee: number;
    platformFeeAmount: number;
    gatewayFeeEstimated: number;
    reserveAmount: number;
    taxEstimate: number;
    partnerAmount: number;
    pricingVersion: string;
  };
};

function fromCentsLocal(c: number): number {
  return c / 100;
}

/**
 * Calcula alocação comercial a partir do snapshot (não da tabela atual).
 */
export function calculateCommercialAllocation(input: CommercialAllocationInput): CommercialAllocation {
  const grossAmountCents = toCents(input.grossAmount);
  const discountAmountCents = toCents(input.discountAmount ?? 0);
  assertNonNegativeCents(grossAmountCents, "gross");
  assertNonNegativeCents(discountAmountCents, "discount");
  if (discountAmountCents > grossAmountCents) throw new Error("DISCOUNT_EXCEEDS_GROSS");

  const netGrossCents = grossAmountCents - discountAmountCents;
  const platformPercentage = input.platformPercentage;
  if (!Number.isFinite(platformPercentage) || platformPercentage < 0 || platformPercentage > 100) {
    throw new Error("INVALID_PLATFORM_PERCENTAGE");
  }

  const platformPercentageAmountCents = percentOfCents(netGrossCents, platformPercentage);
  const platformFixedFeeCents = toCents(Math.max(0, input.platformFixedFee));

  let gatewayFeeEstimatedCents: MoneyCents;
  if (input.gatewayFeeEstimated !== undefined) {
    gatewayFeeEstimatedCents = toCents(Math.max(0, input.gatewayFeeEstimated));
  } else {
    gatewayFeeEstimatedCents = percentOfCents(netGrossCents, input.gatewayFeePercent ?? 0);
  }

  const bearer = input.gatewayFeeBearer === "PLATFORM" ? "PLATFORM" : "PARTNER";
  const gatewayOnPartner = bearer === "PARTNER" ? gatewayFeeEstimatedCents : 0;

  const afterFeesCents =
    netGrossCents -
    platformPercentageAmountCents -
    platformFixedFeeCents -
    gatewayOnPartner;

  if (afterFeesCents < 0) throw new Error("FEES_EXCEED_GROSS");

  let reserveAmountCents: MoneyCents;
  if (input.reserveAmount !== undefined) {
    reserveAmountCents = toCents(Math.max(0, input.reserveAmount));
  } else {
    reserveAmountCents = percentOfCents(Math.max(0, afterFeesCents), input.reservePercent ?? 0);
  }
  if (reserveAmountCents > afterFeesCents) {
    throw new Error("RESERVE_EXCEEDS_BASE");
  }

  const platformRevenueCents = platformPercentageAmountCents + platformFixedFeeCents;
  let taxEstimateCents: MoneyCents;
  if (input.taxEstimate !== undefined) {
    taxEstimateCents = toCents(Math.max(0, input.taxEstimate));
  } else {
    taxEstimateCents = percentOfCents(platformRevenueCents, input.taxEstimatePercent ?? 0);
  }

  // taxEstimate NÃO reduz partnerPayable (política provisória)
  const partnerPayableCents = afterFeesCents - reserveAmountCents;

  const platformFeeAmountCents = platformPercentageAmountCents + platformFixedFeeCents;

  return {
    grossAmountCents,
    discountAmountCents,
    platformPercentage,
    platformPercentageAmountCents,
    platformFixedFeeCents,
    gatewayFeeEstimatedCents,
    gatewayFeeBearer: bearer,
    reserveAmountCents,
    taxEstimateCents,
    taxReducesPartnerPayable: false,
    partnerPayableCents,
    calculatedPartnerAmountCents: partnerPayableCents,
    pricingVersion: input.pricingVersion,
    asOrderFloats: {
      grossAmount: fromCentsLocal(grossAmountCents),
      discountAmount: fromCentsLocal(discountAmountCents),
      platformPercentage,
      platformFixedFee: fromCentsLocal(platformFixedFeeCents),
      platformFeeAmount: fromCentsLocal(platformFeeAmountCents),
      gatewayFeeEstimated: fromCentsLocal(gatewayFeeEstimatedCents),
      reserveAmount: fromCentsLocal(reserveAmountCents),
      taxEstimate: fromCentsLocal(taxEstimateCents),
      partnerAmount: fromCentsLocal(partnerPayableCents),
      pricingVersion: input.pricingVersion,
    },
  };
}

/**
 * Valida snapshot já persistido no pedido (para postagem de ledger).
 * Rejeita divergência material entre campos.
 */
export function validateOrderFinancialSnapshot(order: {
  grossAmount: number;
  discount?: number;
  platformPercentage: number | null;
  platformFixedFee: number;
  platformFeeAmount: number;
  gatewayFeeEstimated: number;
  reserveAmount: number;
  taxEstimate: number;
  partnerAmount: number;
  pricingVersion: string;
}): CommercialAllocation {
  if (order.platformPercentage == null || !order.pricingVersion) {
    throw new Error("ORDER_MISSING_FINANCIAL_SNAPSHOT");
  }
  const allocation = calculateCommercialAllocation({
    grossAmount: order.grossAmount,
    discountAmount: order.discount ?? 0,
    platformPercentage: order.platformPercentage,
    platformFixedFee: order.platformFixedFee,
    gatewayFeeEstimated: order.gatewayFeeEstimated,
    reserveAmount: order.reserveAmount,
    taxEstimate: order.taxEstimate,
    pricingVersion: order.pricingVersion,
    gatewayFeeBearer: "PARTNER",
  });

  const partnerDiff = Math.abs(allocation.partnerPayableCents - toCents(order.partnerAmount));
  const feeDiff = Math.abs(
    allocation.platformPercentageAmountCents +
      allocation.platformFixedFeeCents -
      toCents(order.platformFeeAmount)
  );
  if (partnerDiff > 1 || feeDiff > 1) {
    throw new Error("ORDER_FINANCIAL_SNAPSHOT_DIVERGENT");
  }
  return allocation;
}
