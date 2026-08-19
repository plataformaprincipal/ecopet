/**
 * Ranking determinístico do Marketplace — sem IA e sem patrocínio misturado.
 *
 * relevance =
 *   0.28 * textMatch (0–1)
 * + 0.12 * categoryMatch
 * + 0.12 * availability
 * + 0.22 * bayesianRating/5
 * + 0.08 * verified
 * + 0.18 * proximity (1 - min(distanceKm, 50)/50; 0.3 se distância desconhecida)
 *
 * Bayesian: (C * m + n * avg) / (C + n) com m=4, C=10
 * para um 5★ com 1 review não superar 4.9★ com 500 reviews.
 *
 * totalCost = price + shippingCost somente quando shippingCost é número.
 * shippingCost === null (unknown) NÃO é tratado como 0.
 */

export const RANKING_WEIGHTS = {
  textMatch: 0.28,
  categoryMatch: 0.12,
  availability: 0.12,
  rating: 0.22,
  verified: 0.08,
  proximity: 0.18,
} as const;

export const BAYESIAN_PRIOR = 4;
export const BAYESIAN_PRIOR_WEIGHT = 10;

export function bayesianRating(average: number, reviewCount: number, prior = BAYESIAN_PRIOR, weight = BAYESIAN_PRIOR_WEIGHT): number {
  const n = Math.max(0, reviewCount);
  const avg = Number.isFinite(average) ? average : prior;
  return (prior * weight + avg * n) / (weight + n);
}

export function proximityScore(distanceKm: number | null | undefined): number {
  if (distanceKm == null || !Number.isFinite(distanceKm)) return 0.3;
  return Math.max(0, 1 - Math.min(distanceKm, 50) / 50);
}

export function relevanceScore(input: {
  textMatch?: number;
  categoryMatch?: boolean;
  available?: boolean;
  rating?: number;
  reviewCount?: number;
  verified?: boolean;
  distanceKm?: number | null;
}): number {
  const text = Math.min(1, Math.max(0, input.textMatch ?? 0.5));
  const ratingAdj = bayesianRating(input.rating ?? 0, input.reviewCount ?? 0) / 5;
  return (
    RANKING_WEIGHTS.textMatch * text +
    RANKING_WEIGHTS.categoryMatch * (input.categoryMatch ? 1 : 0) +
    RANKING_WEIGHTS.availability * (input.available === false ? 0 : 1) +
    RANKING_WEIGHTS.rating * ratingAdj +
    RANKING_WEIGHTS.verified * (input.verified ? 1 : 0) +
    RANKING_WEIGHTS.proximity * proximityScore(input.distanceKm)
  );
}

export type PricedItem = {
  price: number;
  shippingCost: number | null;
};

export function totalCost(item: PricedItem): number | null {
  if (item.shippingCost == null || !Number.isFinite(item.shippingCost)) return null;
  return item.price + item.shippingCost;
}

/** unknown shipping sempre depois dos conhecidos. */
export function compareTotalCost(a: PricedItem, b: PricedItem): number {
  const ta = totalCost(a);
  const tb = totalCost(b);
  if (ta == null && tb == null) return a.price - b.price;
  if (ta == null) return 1;
  if (tb == null) return -1;
  return ta - tb;
}

export function compareShippingCost(a: PricedItem, b: PricedItem): number {
  const sa = a.shippingCost;
  const sb = b.shippingCost;
  if (sa == null && sb == null) return 0;
  if (sa == null) return 1;
  if (sb == null) return -1;
  return sa - sb;
}

export function compareFastestDelivery(a: { shippingDays: number | null }, b: { shippingDays: number | null }): number {
  const da = a.shippingDays;
  const db = b.shippingDays;
  if (da == null && db == null) return 0;
  if (da == null) return 1;
  if (db == null) return -1;
  return da - db;
}

export function compareNearMe(a: { distanceKm: number | null }, b: { distanceKm: number | null }): number {
  const da = a.distanceKm ?? Number.POSITIVE_INFINITY;
  const db = b.distanceKm ?? Number.POSITIVE_INFINITY;
  return da - db;
}

export function textMatchScore(q: string | undefined, fields: Array<string | null | undefined>): number {
  if (!q?.trim()) return 0.5;
  const needle = q.trim().toLowerCase();
  let best = 0;
  for (const field of fields) {
    if (!field) continue;
    const hay = field.toLowerCase();
    if (hay === needle) best = Math.max(best, 1);
    else if (hay.startsWith(needle)) best = Math.max(best, 0.9);
    else if (hay.includes(needle)) best = Math.max(best, 0.7);
  }
  return best;
}

export function isWithinRadius(distanceKm: number | null | undefined, radiusKm: number | undefined): boolean {
  if (radiusKm == null || radiusKm <= 0) return true;
  if (distanceKm == null || !Number.isFinite(distanceKm)) return false;
  return distanceKm <= radiusKm;
}
