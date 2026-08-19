/**
 * Personalização determinística de serviços.
 * Reusa bayesianRating + proximityScore do ranking do Marketplace.
 * Não usa GPT. openToday = janela de weekday cadastrada, não vaga livre.
 */

import { bayesianRating, proximityScore } from "./ranking";

export const SERVICE_PERSONALIZE_WEIGHTS = {
  compatibility: 0.22,
  proximity: 0.22,
  rating: 0.22,
  openToday: 0.12,
  value: 0.14,
  verified: 0.08,
} as const;

const WEEKDAY_SHORT: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

/** Dia da semana em America/Sao_Paulo (0=domingo), alinhado a PartnerAvailability. */
export function weekdayInSaoPaulo(now = new Date()): number {
  const short = new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    timeZone: "America/Sao_Paulo",
  }).format(now);
  return WEEKDAY_SHORT[short] ?? now.getUTCDay();
}

export function isOpenOnWeekday(
  slots: Array<{ weekday: number; isActive?: boolean }> | null | undefined,
  weekday = weekdayInSaoPaulo()
): boolean {
  if (!slots?.length) return false;
  return slots.some((s) => s.weekday === weekday && s.isActive !== false);
}

/**
 * 1 = espécie do pet bate; 0.55 = serviço sem espécie (vale para todos);
 * 0 = incompatível. Sem pet, nulo.
 */
export function speciesCompatibilityScore(
  serviceSpecies?: string | null,
  petSpecies?: string | null
): number {
  if (!petSpecies) return 0.5;
  if (!serviceSpecies) return 0.55;
  return serviceSpecies === petSpecies ? 1 : 0;
}

export function isServiceCompatibleWithPet(
  serviceSpecies?: string | null,
  petSpecies?: string | null
): boolean {
  if (!petSpecies) return false;
  if (!serviceSpecies) return true;
  return serviceSpecies === petSpecies;
}

/** Bayes / preço — maior é melhor custo-benefício. Preço 0 ou inválido vai para o fim. */
export function serviceValueScore(rating: number, reviewCount: number, price: number): number {
  if (!Number.isFinite(price) || price <= 0) return 0;
  return bayesianRating(rating, reviewCount) / price;
}

export function compareServiceValue(
  a: { rating: number; reviewCount: number; price: number },
  b: { rating: number; reviewCount: number; price: number }
): number {
  return serviceValueScore(b.rating, b.reviewCount, b.price) - serviceValueScore(a.rating, a.reviewCount, a.price);
}

function normalizedValue(price: number, rating: number, reviewCount: number): number {
  if (!Number.isFinite(price) || price <= 0) return 0;
  const raw = serviceValueScore(rating, reviewCount, price);
  return Math.min(1, raw / 0.2);
}

export function servicePersonalizationScore(input: {
  petSpecies?: string | null;
  serviceSpecies?: string | null;
  distanceKm?: number | null;
  rating?: number;
  reviewCount?: number;
  openToday?: boolean;
  price?: number;
  verified?: boolean;
}): number {
  const ratingAdj = bayesianRating(input.rating ?? 0, input.reviewCount ?? 0) / 5;
  return (
    SERVICE_PERSONALIZE_WEIGHTS.compatibility * speciesCompatibilityScore(input.serviceSpecies, input.petSpecies) +
    SERVICE_PERSONALIZE_WEIGHTS.proximity * proximityScore(input.distanceKm) +
    SERVICE_PERSONALIZE_WEIGHTS.rating * ratingAdj +
    SERVICE_PERSONALIZE_WEIGHTS.openToday * (input.openToday ? 1 : 0) +
    SERVICE_PERSONALIZE_WEIGHTS.value * normalizedValue(input.price ?? 0, input.rating ?? 0, input.reviewCount ?? 0) +
    SERVICE_PERSONALIZE_WEIGHTS.verified * (input.verified ? 1 : 0)
  );
}
