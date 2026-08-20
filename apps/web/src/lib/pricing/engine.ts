/**
 * Pricing Engine — cálculos em centavos, ordem determinística.
 * Frontend nunca é autoridade: este módulo recalcula tudo.
 */
import type {
  CatalogItem,
  CouponInput,
  PricingQuote,
  PromotionInput,
  QuoteInput,
  QuoteKind,
  ResolvedPricingVersion,
} from "./types";
import { PricingError } from "./types";

const SERVICE_LIKE: QuoteKind[] = ["SERVICE", "HEALTH"];
const PRODUCT_LIKE: QuoteKind[] = ["PRODUCT"];

function assertFiniteNonNegative(value: number, code: string) {
  if (!Number.isFinite(value) || value < 0) throw new PricingError(code, code);
}

function assertIntegerCents(value: number, code: string) {
  if (!Number.isInteger(value) || value < 0) throw new PricingError(code, code);
}

function percentBpsOfCents(baseCents: number, bps: number): number {
  if (!Number.isFinite(bps) || bps < 0 || bps > 10_000) {
    throw new PricingError("INVALID_PERCENT", "Percentual fora dos limites.");
  }
  return Math.round((baseCents * bps) / 10_000);
}

function dateInRange(at: Date, fromIso: string, toIso: string | null | undefined): boolean {
  const from = new Date(fromIso);
  if (Number.isNaN(from.getTime()) || at < from) return false;
  if (!toIso) return true;
  const to = new Date(toIso);
  if (Number.isNaN(to.getTime())) return false;
  return at <= to;
}

function floorForKind(kind: QuoteKind, version: ResolvedPricingVersion): number | null {
  if (kind === "AI") return version.rules.floorSaasAiBps;
  if (kind === "SUBSCRIPTION" || kind === "ADDON") return version.rules.floorSubscriptionBps;
  if (kind === "ADS") return version.rules.floorAdsFeeBps;
  return 0;
}

function isPurchasable(item: CatalogItem | null | undefined): boolean {
  if (!item) return true;
  return item.commercialAvailability === "PURCHASABLE";
}

function applyDiscountCents(
  baseCents: number,
  discount: { discountType: string; discountValue: number } | null | undefined
): number {
  if (!discount) return 0;
  const type = discount.discountType.toUpperCase();
  let amount = 0;
  if (type === "PERCENT" || type === "PERCENTAGE") {
    if (discount.discountValue < 0 || discount.discountValue > 100) {
      throw new PricingError("INVALID_DISCOUNT", "Desconto percentual inválido.");
    }
    amount = Math.round((baseCents * discount.discountValue) / 100);
  } else {
    amount = Math.round(discount.discountValue * 100);
  }
  if (!Number.isFinite(amount) || amount < 0) {
    throw new PricingError("INVALID_DISCOUNT", "Desconto inválido.");
  }
  return Math.min(baseCents, amount);
}

function validatePromotion(promo: PromotionInput | null | undefined, at: Date, kind: QuoteKind) {
  if (!promo) return;
  if (promo.status !== "ACTIVE") {
    throw new PricingError("PROMOTION_INACTIVE", "Promoção fora de vigência.");
  }
  if (new Date(promo.validTo) < new Date(promo.validFrom)) {
    throw new PricingError("INVALID_DATE_RANGE", "Vigência da promoção invertida.");
  }
  if (!dateInRange(at, promo.validFrom, promo.validTo)) {
    throw new PricingError("PROMOTION_INACTIVE", "Promoção fora de vigência.");
  }
  if (promo.scope && promo.scope !== "ALL" && promo.scope !== kind) {
    throw new PricingError("PROMOTION_SCOPE", "Promoção não se aplica a este item.");
  }
}

function validateOverride(input: QuoteInput, at: Date, defaultPercentBps: number, kind: QuoteKind) {
  const ov = input.contractOverride;
  if (!ov) return { percentBps: defaultPercentBps, extraFixedCents: 0 };
  if (new Date(ov.validTo) < new Date(ov.validFrom)) {
    throw new PricingError("INVALID_DATE_RANGE", "Vigência da exceção invertida.");
  }
  if (!dateInRange(at, ov.validFrom, ov.validTo)) {
    return { percentBps: defaultPercentBps, extraFixedCents: 0 };
  }
  if (ov.approvalRequired !== false && !ov.approvedByAdminId) {
    throw new PricingError("OVERRIDE_APPROVAL_REQUIRED", "Exceção comercial exige aprovação.");
  }
  const floor =
    kind === "PRODUCT"
      ? input.version.rules.exceptionFloorProductBps
      : SERVICE_LIKE.includes(kind)
        ? input.version.rules.exceptionFloorServiceBps
        : 0;
  if (ov.commissionPercentBps < floor && !ov.approvedByAdminId) {
    throw new PricingError("OVERRIDE_BELOW_FLOOR", "Comissão abaixo do piso sem aprovação financeira.");
  }
  if (ov.commissionPercentBps < ov.floorPercentBps && !ov.approvedByAdminId) {
    throw new PricingError("OVERRIDE_BELOW_FLOOR", "Comissão abaixo do piso contratual.");
  }
  return {
    percentBps: ov.commissionPercentBps,
    extraFixedCents: ov.fixedFeeCents ?? 0,
  };
}

export function quotePricing(input: QuoteInput & { omitFixedFee?: boolean }): PricingQuote {
  const version = input.version;
  const at = input.pricingDate ?? new Date();
  const quantity = input.quantity ?? 1;
  const currency = input.currency ?? version.currency;
  const country = input.country ?? version.country;

  if (currency !== "BRL" && currency !== version.currency) {
    throw new PricingError("INVALID_CURRENCY", "Moeda inválida para esta versão.");
  }
  if (country !== version.country) {
    throw new PricingError("INVALID_COUNTRY", "País fora da vigência desta versão.");
  }
  if (!Number.isInteger(quantity) || quantity <= 0) {
    throw new PricingError("INVALID_QUANTITY", "Quantidade inválida.");
  }
  if (!Number.isFinite(input.baseAmountCents) || Number.isNaN(input.baseAmountCents)) {
    throw new PricingError("INVALID_AMOUNT", "Valor base inválido.");
  }
  if (input.baseAmountCents > 1_000_000_000) {
    throw new PricingError("AMOUNT_OVERFLOW", "Valor acima do limite operacional.");
  }
  if (input.baseAmountCents < 0) {
    throw new PricingError("INVALID_AMOUNT", "Valor negativo não permitido.");
  }

  if (version.status !== "ACTIVE") {
    throw new PricingError("VERSION_NOT_ACTIVE", "Versão de pricing não está ACTIVE.");
  }
  if (!dateInRange(at, version.validFrom, version.validTo)) {
    throw new PricingError("VERSION_NOT_IN_FORCE", "Versão de pricing fora da vigência.");
  }

  const kind = input.kind;
  const item = input.catalogItem ?? null;
  const allowZero = Boolean(input.allowZero || item?.allowZero);
  const lineBase = Math.round(input.baseAmountCents) * quantity;
  assertIntegerCents(lineBase, "INVALID_AMOUNT");

  if (lineBase === 0 && !allowZero) {
    throw new PricingError("ZERO_PRICE_NOT_ALLOWED", "Preço zero somente para SKU explicitamente gratuito.");
  }

  const urgentRequested = Boolean(input.urgent);
  const urgentEligible = Boolean(input.urgentEligible ?? item?.urgentEligible);
  if (urgentRequested && !urgentEligible) {
    throw new PricingError("URGENT_NOT_ELIGIBLE", "Taxa urgente somente para serviço elegível.");
  }

  const rules = version.rules;
  const isService = SERVICE_LIKE.includes(kind);
  const isProduct = PRODUCT_LIKE.includes(kind);

  let commissionPercentBps = isProduct
    ? rules.productCommissionPercentBps
    : isService
      ? rules.serviceCommissionPercentBps
      : 0;
  let extraFixedFromOverride = 0;

  if (isProduct || isService) {
    const resolved = validateOverride(input, at, commissionPercentBps, kind);
    commissionPercentBps = resolved.percentBps;
    extraFixedFromOverride = resolved.extraFixedCents;
  }

  const commissionCents = percentBpsOfCents(lineBase, commissionPercentBps);
  const productFixedCents = input.omitFixedFee
    ? 0
    : isProduct
      ? rules.productFixedFeeCents + extraFixedFromOverride
      : extraFixedFromOverride;
  const bookingFeeCents = isService ? rules.serviceBookingFeeCents : 0;
  const urgentFeeCents = isService && urgentRequested && urgentEligible ? rules.serviceUrgentFeeCents : 0;

  let customerAmountCents = isService ? lineBase + bookingFeeCents + urgentFeeCents : lineBase;
  if (kind === "SUBSCRIPTION" || kind === "ADDON" || kind === "AI" || kind === "ADS" || kind === "IOT" || kind === "API") {
    customerAmountCents = lineBase;
  }

  validatePromotion(input.promotion ?? null, at, kind);
  const promoDiscount = applyDiscountCents(customerAmountCents, input.promotion);
  const couponDiscount = applyDiscountCents(customerAmountCents - promoDiscount, input.coupon ?? null);
  const discountCents = promoDiscount + couponDiscount;
  const fundedBy = input.coupon?.fundedBy ?? input.promotion?.fundedBy ?? (discountCents ? "ECCOPET" : null);

  const netCustomerCents = customerAmountCents - discountCents;
  const eccopetRevenueBeforeDiscount = isProduct
    ? commissionCents + productFixedCents
    : isService
      ? commissionCents + bookingFeeCents + urgentFeeCents
      : lineBase;

  let eccopetRevenueCents = eccopetRevenueBeforeDiscount;
  if (fundedBy === "ECCOPET") {
    eccopetRevenueCents = Math.max(0, eccopetRevenueCents - discountCents);
  }

  const reserveBps = isProduct ? rules.productReserveBps : isService ? rules.serviceReserveBps : 0;
  const reserveBasis = isService ? lineBase : lineBase;
  const reserveCents = percentBpsOfCents(reserveBasis, reserveBps);

  const pspBase = netCustomerCents;
  const estimatedPspCents =
    isProduct || isService
      ? percentBpsOfCents(pspBase, rules.pspEstimatePercentBps) + rules.pspEstimateFixedFeeCents
      : percentBpsOfCents(pspBase, rules.pspEstimatePercentBps) + (pspBase > 0 ? rules.pspEstimateFixedFeeCents : 0);

  const estimatedTaxProvisionCents = percentBpsOfCents(eccopetRevenueCents, rules.taxProvisionBps);

  const partnerEconomicAmountCents = isProduct
    ? lineBase - commissionCents - productFixedCents
    : isService
      ? lineBase - commissionCents
      : 0;
  let estimatedPayoutAfterReleaseCents = partnerEconomicAmountCents;
  if ((isProduct || isService) && rules.pspPayer === "PARTNER") {
    estimatedPayoutAfterReleaseCents = partnerEconomicAmountCents - estimatedPspCents;
  }
  if (fundedBy === "SELLER" || fundedBy === "PROVIDER" || fundedBy === "PARTNER") {
    estimatedPayoutAfterReleaseCents -= discountCents;
  }
  const estimatedPayoutCents = estimatedPayoutAfterReleaseCents - reserveCents;

  if ((isProduct || isService) && estimatedPayoutCents < 0) {
    throw new PricingError("NEGATIVE_PAYOUT", "Payout do parceiro não pode ser negativo.");
  }

  const costRef = item?.costReferenceCents ?? 0;
  const contributionEstimateCents = eccopetRevenueCents - costRef - estimatedTaxProvisionCents;
  const marginGuardrailBps = floorForKind(kind, version);
  const marginBps =
    eccopetRevenueCents > 0 ? Math.round((contributionEstimateCents * 10_000) / eccopetRevenueCents) : null;

  if (fundedBy === "ECCOPET" && marginGuardrailBps != null && marginGuardrailBps > 0 && marginBps != null) {
    const couponFloor = input.coupon?.marginFloorBps ?? input.promotion?.marginFloorBps ?? marginGuardrailBps;
    if (marginBps < couponFloor) {
      throw new PricingError("MARGIN_FLOOR", "Desconto recusado: margem abaixo do piso.");
    }
  }

  const blockedReasons: string[] = [];
  if (input.partnerVerified === false && (isProduct || isService)) {
    blockedReasons.push("PARTNER_NOT_VERIFIED");
  }
  if (item && !isPurchasable(item)) {
    blockedReasons.push(`NOT_PURCHASABLE:${item.commercialAvailability}`);
  }
  if (item?.capabilityId === undefined && kind === "AI" && item) {
    blockedReasons.push("CAPABILITY_UNAVAILABLE");
  }

  const roundingAdjustmentCents = 0;
  const payoutDays = isProduct ? rules.productPayoutDays : isService ? rules.servicePayoutDays : 0;

  const snapshot: Record<string, unknown> = {
    pricingVersion: version.version,
    country,
    currency,
    kind,
    sku: item?.sku ?? input.sku ?? null,
    pricingMode: item?.pricingMode ?? null,
    quantity,
    baseAmountCents: lineBase,
    customerAmountCents: netCustomerCents,
    eccopetCommissionCents: commissionCents,
    commissionPercentBps,
    fixedFeeCents: productFixedCents,
    bookingFeeCents,
    urgentFeeCents,
    discountCents,
    couponCode: input.coupon?.code ?? null,
    discountFundedBy: fundedBy,
    reserveCents,
    estimatedPspCents,
    estimatedTaxProvisionCents,
    partnerEconomicAmountCents,
    estimatedPayoutCents,
    estimatedPayoutAfterReleaseCents,
    eccopetRevenueCents,
    roundingAdjustmentCents,
    payoutDays,
    sourceDocument: item?.sourceDocument ?? version.sourceDocument,
    calculationOrder: [
      "version",
      "sku",
      "base",
      "override",
      "commission",
      "fees",
      "promotion",
      "coupon",
      "guardrail",
      "reserve",
      "psp",
      "payout",
      "round",
    ],
  };

  return {
    pricingVersion: version.version,
    pricingVersionStatus: version.status,
    country,
    currency,
    kind,
    sku: item?.sku ?? input.sku ?? null,
    pricingMode: item?.pricingMode ?? null,
    quantity,
    baseAmountCents: lineBase,
    customerAmountCents: netCustomerCents,
    eccopetCommissionCents: commissionCents,
    commissionPercentBps,
    fixedFeeCents: productFixedCents,
    bookingFeeCents,
    urgentFeeCents,
    discountCents,
    couponCode: input.coupon?.code ?? null,
    discountFundedBy: fundedBy,
    reserveCents,
    estimatedPspCents,
    estimatedTaxProvisionCents,
    partnerEconomicAmountCents,
    estimatedPayoutCents,
    estimatedPayoutAfterReleaseCents,
    eccopetRevenueCents,
    contributionEstimateCents,
    marginBps,
    marginGuardrailBps,
    roundingAdjustmentCents,
    payoutDays,
    labels: { psp: "Estimativa", tax: "Estimativa", payout: "Estimativa" },
    blockedReasons,
    purchasable: blockedReasons.length === 0,
    snapshot,
  };
}

export function quoteProductOrder(params: {
  version: ResolvedPricingVersion;
  lines: { unitPriceCents: number; quantity: number; sku?: string; catalogItem?: CatalogItem | null }[];
  coupon?: CouponInput | null;
  partnerVerified?: boolean;
  pricingDate?: Date;
  contractOverride?: QuoteInput["contractOverride"];
}): {
  lines: PricingQuote[];
  order: PricingQuote;
} {
  if (!params.lines.length) throw new PricingError("EMPTY_QUOTE", "Pedido sem itens.");
  const lineQuotes = params.lines.map((line) =>
    quotePricing({
      kind: "PRODUCT",
      sku: line.sku,
      baseAmountCents: line.unitPriceCents,
      quantity: line.quantity,
      version: params.version,
      catalogItem: line.catalogItem,
      partnerVerified: params.partnerVerified,
      pricingDate: params.pricingDate,
      contractOverride: params.contractOverride,
      omitFixedFee: true,
    })
  );

  const gross = lineQuotes.reduce((s, l) => s + l.baseAmountCents, 0);
  const commission = lineQuotes.reduce((s, l) => s + l.eccopetCommissionCents, 0);
  const orderQuote = quotePricing({
    kind: "PRODUCT",
    baseAmountCents: gross,
    quantity: 1,
    coupon: params.coupon,
    version: params.version,
    partnerVerified: params.partnerVerified,
    pricingDate: params.pricingDate,
    contractOverride: params.contractOverride,
  });

  return {
    lines: lineQuotes.map((line, idx) => ({
      ...line,
      fixedFeeCents: idx === lineQuotes.length - 1 ? orderQuote.fixedFeeCents : 0,
      discountCents: 0,
      couponCode: orderQuote.couponCode,
    })),
    order: {
      ...orderQuote,
      eccopetCommissionCents: commission,
      eccopetRevenueCents: commission + orderQuote.fixedFeeCents - (orderQuote.discountFundedBy === "ECCOPET" ? orderQuote.discountCents : 0),
      snapshot: {
        ...orderQuote.snapshot,
        lineCount: lineQuotes.length,
        lineSkus: lineQuotes.map((l) => l.sku),
      },
    },
  };
}

export { assertFiniteNonNegative, percentBpsOfCents, PricingError };
