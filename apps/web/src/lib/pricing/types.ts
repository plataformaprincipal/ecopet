/**
 * Tipos do Pricing Engine EccoPet.
 * Dinheiro crítico: centavos inteiros. Conversão nas bordas.
 */

export const OFFICIAL_PRICING_VERSION = "BR-2026.08-v1";
export const OFFICIAL_COUNTRY = "BR";
export const OFFICIAL_CURRENCY = "BRL";
export const SOURCE_DOCUMENT = "Planejamento Financeiro e Orçamentário";

export type PricingVersionStatus = "DRAFT" | "SCHEDULED" | "ACTIVE" | "ARCHIVED";
export type PricingSuite =
  | "MARKET"
  | "SERVICES"
  | "HEALTH"
  | "ONE"
  | "PRO"
  | "AI"
  | "ADS"
  | "PROTECT"
  | "CONNECT"
  | "API";

export type PricingMode =
  | "SELLER_DEFINED"
  | "PROVIDER_DEFINED"
  | "ECCOPET_FIXED"
  | "PARTNER_PRODUCT"
  | "REFERENCE_ONLY";

export type PricingItemKind =
  | "PRODUCT"
  | "SERVICE"
  | "HEALTH"
  | "SUBSCRIPTION"
  | "ADDON"
  | "AI"
  | "ADS"
  | "PROTECT"
  | "IOT"
  | "API";

export type PricingCommercialAvailability =
  | "PURCHASABLE"
  | "CATALOG_ONLY"
  | "FEATURE_FLAGGED"
  | "PARTNER_REQUIRED"
  | "DISABLED";

export type PricingRevenueRecognition =
  | "COMMISSION_AND_FEE"
  | "SUBSCRIPTION"
  | "MANAGEMENT_FEE"
  | "AFFILIATE_COMMISSION"
  | "PASS_THROUGH_NOT_REVENUE"
  | "PREMIUM_NOT_REVENUE";

export type QuoteKind = "PRODUCT" | "SERVICE" | "HEALTH" | "SUBSCRIPTION" | "ADDON" | "AI" | "ADS" | "PROTECT" | "IOT" | "API";

export type DiscountFundedBy = "ECCOPET" | "SELLER" | "PROVIDER" | "PARTNER";

export type PricingPolicyRules = {
  productCommissionPercentBps: number;
  productFixedFeeCents: number;
  productReserveBps: number;
  productPayoutDays: number;
  serviceCommissionPercentBps: number;
  serviceBookingFeeCents: number;
  serviceUrgentFeeCents: number;
  serviceReserveBps: number;
  servicePayoutDays: number;
  /** Premissa de planejamento — NÃO é taxa contratual do PSP. */
  pspEstimatePercentBps: number;
  pspEstimateFixedFeeCents: number;
  pspPayer: "PARTNER" | "PLATFORM";
  /** Provisão de planejamento sobre receita própria EccoPet. */
  taxProvisionBps: number;
  floorSaasAiBps: number;
  floorSubscriptionBps: number;
  floorAdsFeeBps: number;
  exceptionFloorProductBps: number;
  exceptionFloorServiceBps: number;
  maxDiscountWithoutApprovalBps: number;
  /** Hooks de política — implementação operacional permanece nos módulos existentes. */
  cancelPolicyCode: string;
  noShowPolicyCode: string;
  refundPolicyCode: string;
  chargebackPolicyCode: string;
};

export type CatalogItem = {
  sku: string;
  name: string;
  suite: PricingSuite;
  kind: PricingItemKind;
  pricingMode: PricingMode;
  commercialAvailability: PricingCommercialAvailability;
  revenueRecognition: PricingRevenueRecognition;
  amountCents?: number;
  annualAmountCents?: number;
  setupAmountCents?: number;
  referenceTicketCents?: number;
  referenceTutorCents?: number;
  providerBaseCents?: number;
  rangeMinCents?: number;
  rangeMaxCents?: number;
  nationalReferenceCents?: number;
  costReferenceCents?: number;
  eccopetRevenueRefCents?: number;
  unit?: string;
  billingCycle?: string;
  urgentEligible?: boolean;
  complexProcedure?: boolean;
  allowZero?: boolean;
  capabilityId?: string;
  portfolioSuiteId: string;
  mediaPassThrough?: boolean;
  sourceDocument: string;
  sourceSection: string;
  sourceSku: string;
};

export type ResolvedPricingVersion = {
  id?: string;
  version: string;
  country: string;
  currency: string;
  status: PricingVersionStatus;
  validFrom: string;
  validTo: string | null;
  approvedBy: string | null;
  approvedAt: string | null;
  rollbackVersion: string | null;
  sourceDocument: string;
  sourceSection: string;
  rules: PricingPolicyRules;
};

export type ContractOverrideInput = {
  partnerId: string;
  commissionPercentBps: number;
  fixedFeeCents?: number;
  validFrom: string;
  validTo: string;
  reason: string;
  approvedByAdminId?: string | null;
  approvedAt?: string | null;
  approvalRequired?: boolean;
  floorPercentBps: number;
};

export type PromotionInput = {
  id?: string;
  name: string;
  scope: string;
  fundedBy: DiscountFundedBy;
  validFrom: string;
  validTo: string;
  discountType: "PERCENT" | "FIXED";
  discountValue: number;
  maxUsage?: number | null;
  maxUsagePerUser?: number | null;
  marginFloorBps?: number | null;
  status: string;
};

export type CouponInput = {
  code: string;
  discountType: "PERCENT" | "FIXED";
  discountValue: number;
  fundedBy?: DiscountFundedBy;
  marginFloorBps?: number | null;
};

export type QuoteInput = {
  kind: QuoteKind;
  sku?: string;
  country?: string;
  currency?: string;
  /** Preço seller / base do prestador — nunca o frontend como autoridade. */
  baseAmountCents: number;
  quantity?: number;
  partnerId?: string;
  userId?: string;
  coupon?: CouponInput | null;
  promotion?: PromotionInput | null;
  contractOverride?: ContractOverrideInput | null;
  urgent?: boolean;
  urgentEligible?: boolean;
  partnerVerified?: boolean;
  allowZero?: boolean;
  pricingDate?: Date;
  version: ResolvedPricingVersion;
  catalogItem?: CatalogItem | null;
  /** Suite usada no floor de margem quando não há SKU. */
  suite?: PricingSuite;
};

export type PricingQuote = {
  pricingVersion: string;
  pricingVersionStatus: PricingVersionStatus;
  country: string;
  currency: string;
  kind: QuoteKind;
  sku: string | null;
  pricingMode: PricingMode | null;
  quantity: number;
  baseAmountCents: number;
  customerAmountCents: number;
  eccopetCommissionCents: number;
  commissionPercentBps: number;
  fixedFeeCents: number;
  bookingFeeCents: number;
  urgentFeeCents: number;
  discountCents: number;
  couponCode: string | null;
  discountFundedBy: DiscountFundedBy | null;
  reserveCents: number;
  estimatedPspCents: number;
  estimatedTaxProvisionCents: number;
  partnerEconomicAmountCents: number;
  estimatedPayoutCents: number;
  estimatedPayoutAfterReleaseCents: number;
  eccopetRevenueCents: number;
  contributionEstimateCents: number;
  marginBps: number | null;
  marginGuardrailBps: number | null;
  roundingAdjustmentCents: number;
  payoutDays: number;
  labels: {
    psp: "Estimativa";
    tax: "Estimativa";
    payout: "Estimativa";
  };
  blockedReasons: string[];
  purchasable: boolean;
  snapshot: Record<string, unknown>;
};

export class PricingError extends Error {
  constructor(
    public code: string,
    message: string
  ) {
    super(message);
    this.name = "PricingError";
  }
}
