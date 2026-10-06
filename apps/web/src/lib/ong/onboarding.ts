import {
  evaluatePartnerOnboarding,
  hasBankingDetails,
  hasDocuments,
  isMercadoPagoConnected,
  type PartnerOnboardingSnapshot,
} from "@/lib/partner/onboarding";

export const ONG_ADS_CREDITS_PER_YEAR = 20;
export const ONG_MONTHLY_FEE_BRL = 0;
export const ONG_ADOPTION_FEE_BPS = 0;
export const ONG_DONATION_FEE_BPS = 0;

export type OngOnboardingSnapshot = PartnerOnboardingSnapshot & {
  adsCreditsPerYear: number;
  adsCreditsUsed: number;
  adsCreditsRemaining: number;
  monthlyFeeBrl: number;
};

type OngOnboardingInput = {
  accountStatus?: string | null;
  verificationStatus?: string | null;
  approvedAt?: Date | string | null;
  name?: string | null;
  ongName?: string | null;
  responsible?: string | null;
  address?: string | null;
  city?: string | null;
  description?: string | null;
  focusArea?: string | null;
  documents?: unknown;
  profileDetails?: unknown;
  financialDetails?: unknown;
  mpStatus?: string | null;
  mpUserId?: string | null;
};

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

export function isOngFeeExemptCategory(category?: string | null): boolean {
  const value = String(category ?? "").toUpperCase();
  return (
    value.includes("ADOPTION") ||
    value.includes("ADOCAO") ||
    value.includes("ADOÇÃO") ||
    value.includes("DONATION") ||
    value.includes("DOACAO") ||
    value.includes("DOAÇÃO")
  );
}

export function readOngAdsCredits(profileDetails: unknown): { used: number; granted: number } {
  const rec = asRecord(profileDetails);
  const ads = asRecord(rec.adsCredits);
  const used = Number(ads.used ?? rec.adsCreditsUsed ?? 0);
  const granted = Number(ads.granted ?? rec.adsCreditsGranted ?? ONG_ADS_CREDITS_PER_YEAR);
  return {
    used: Number.isFinite(used) && used > 0 ? used : 0,
    granted: Number.isFinite(granted) && granted > 0 ? granted : ONG_ADS_CREDITS_PER_YEAR,
  };
}

export function evaluateOngOnboarding(input: OngOnboardingInput): OngOnboardingSnapshot {
  const name = input.ongName || input.name;
  const base = evaluatePartnerOnboarding({
    accountStatus: input.accountStatus,
    verificationStatus: input.verificationStatus,
    approvedAt: input.approvedAt,
    businessName: name,
    legalName: name,
    category: input.focusArea ?? "ONG",
    address: input.address,
    city: input.city,
    description: input.description,
    financialDetails: input.financialDetails ?? asRecord(input.profileDetails).financialDetails,
    verificationDocuments: input.documents,
    mpStatus: input.mpStatus,
    mpUserId: input.mpUserId,
  });
  const ads = readOngAdsCredits(input.profileDetails);
  const receiving = base.checklist.approved && base.checklist.mercadoPago;
  return {
    ...base,
    sellable: receiving,
    adsCreditsPerYear: ads.granted,
    adsCreditsUsed: ads.used,
    adsCreditsRemaining: Math.max(0, ads.granted - ads.used),
    monthlyFeeBrl: ONG_MONTHLY_FEE_BRL,
  };
}

export { hasBankingDetails, hasDocuments };
