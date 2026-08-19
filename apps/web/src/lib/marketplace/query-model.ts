/**
 * Fonte única de filtros do Marketplace.
 * URL pública nunca leva lat/lng precisos — só `near=1`, `radiusKm` e cidade/CEP.
 */

export const MARKETPLACE_DEFAULT_RADIUS_KM = 10;
export const MARKETPLACE_RADIUS_OPTIONS_KM = [2, 5, 10, 25, 50] as const;
export const MARKETPLACE_SEARCH_DEBOUNCE_MS = 400;
export const MARKETPLACE_PAGE_SIZE = 12;

/**
 * Feature flags honestas — não mostrar filtro/sort sem dado real.
 * DISABLED — shippingCost/ETA não existem em Product (só em Order pós-checkout).
 */
export const MARKETPLACE_FEATURES = {
  freeShipping: false,
  shippingEta: false,
  shippingCostSort: false,
  totalCostSort: false,
  fastestDeliverySort: false,
  serviceRealtimeAvailability: false,
  petSizeFilter: false,
  subscriptionFilter: false,
} as const;

export type MarketplaceResultType = "all" | "product" | "service" | "partner";

export type MarketplaceSort =
  | "relevance"
  | "newest"
  | "price_asc"
  | "price_desc"
  | "rating"
  | "popular"
  | "near_me"
  | "total_cost"
  | "shipping_cost"
  | "fastest_delivery"
  | "value";

export const MARKETPLACE_SORTS: { value: MarketplaceSort; labelKey: string; needsLocation?: boolean; feature?: keyof typeof MARKETPLACE_FEATURES; serviceOnly?: boolean }[] = [
  { value: "relevance", labelKey: "pub.marketplace.sortRelevance" },
  { value: "near_me", labelKey: "pub.marketplace.sortNearMe", needsLocation: true },
  { value: "value", labelKey: "marketplace.servicesPage.sortValue", serviceOnly: true },
  { value: "total_cost", labelKey: "pub.marketplace.sortTotalCost", feature: "totalCostSort" },
  { value: "shipping_cost", labelKey: "pub.marketplace.sortShippingCost", feature: "shippingCostSort" },
  { value: "fastest_delivery", labelKey: "pub.marketplace.sortFastest", feature: "fastestDeliverySort" },
  { value: "price_asc", labelKey: "pub.marketplace.sortPriceAsc" },
  { value: "rating", labelKey: "pub.marketplace.sortRating" },
  { value: "newest", labelKey: "pub.marketplace.sortNewest" },
  { value: "popular", labelKey: "pub.marketplace.sortPopular" },
  { value: "price_desc", labelKey: "pub.marketplace.sortPriceDesc" },
];

export function enabledMarketplaceSorts(type?: MarketplaceResultType): typeof MARKETPLACE_SORTS {
  return MARKETPLACE_SORTS.filter((s) => {
    if (s.feature && !MARKETPLACE_FEATURES[s.feature]) return false;
    if (s.serviceOnly && type !== "service") return false;
    return true;
  });
}

export type MarketplaceQuery = {
  q?: string;
  type?: MarketplaceResultType;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  verifiedOnly?: boolean;
  freeShipping?: boolean;
  promoOnly?: boolean;
  inStock?: boolean;
  homeService?: boolean;
  telehealth?: boolean;
  openToday?: boolean;
  species?: string;
  brand?: string;
  city?: string;
  group?: string;
  sort?: MarketplaceSort;
  near?: boolean;
  radiusKm?: number;
  page?: number;
  pageSize?: number;
};

export const EMPTY_MARKETPLACE_QUERY: MarketplaceQuery = {
  type: "all",
  sort: "relevance",
  inStock: true,
};

const SPECIES: Record<string, string> = {
  dog: "DOG",
  cat: "CAT",
  bird: "BIRD",
  rodent: "RODENT",
  reptile: "REPTILE",
  fish: "FISH",
  other: "OTHER",
  DOG: "DOG",
  CAT: "CAT",
  BIRD: "BIRD",
  RODENT: "RODENT",
  REPTILE: "REPTILE",
  FISH: "FISH",
  OTHER: "OTHER",
};

export function normalizeSpecies(raw?: string | null): string | undefined {
  if (!raw) return undefined;
  return SPECIES[raw] ?? SPECIES[raw.toLowerCase()] ?? SPECIES[raw.toUpperCase()];
}

export function parsePositiveNumber(raw?: string | null): number | undefined {
  if (raw == null || raw === "") return undefined;
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 0) return undefined;
  return n;
}

export function clampPriceRange(min?: number, max?: number): { minPrice?: number; maxPrice?: number } {
  if (min != null && max != null && min > max) return { minPrice: max, maxPrice: min };
  return { minPrice: min, maxPrice: max };
}

export function parseMarketplaceSort(raw?: string | null): MarketplaceSort {
  if (raw === "distance" || raw === "nearest") return "near_me";
  if (raw === "bestseller") return "popular";
  if (raw === "ai") return "relevance";
  if (
    raw === "relevance" ||
    raw === "newest" ||
    raw === "price_asc" ||
    raw === "price_desc" ||
    raw === "rating" ||
    raw === "popular" ||
    raw === "near_me" ||
    raw === "total_cost" ||
    raw === "shipping_cost" ||
    raw === "fastest_delivery" ||
    raw === "value"
  ) {
    return raw;
  }
  return "relevance";
}

export function parseMarketplaceType(raw?: string | null): MarketplaceResultType {
  if (raw === "products" || raw === "product") return "product";
  if (raw === "services" || raw === "service") return "service";
  if (raw === "partners" || raw === "partner") return "partner";
  return "all";
}

function boolFromParam(raw: string | null): boolean | undefined {
  if (raw === "true" || raw === "1") return true;
  if (raw === "false" || raw === "0") return false;
  return undefined;
}

export function clampRadiusKm(raw?: number): number | undefined {
  if (raw == null || !Number.isFinite(raw)) return undefined;
  return Math.min(200, Math.max(1, raw));
}

export function nextRadiusKm(current: number): number | undefined {
  const options = MARKETPLACE_RADIUS_OPTIONS_KM;
  const found = options.find((n) => n > current);
  return found;
}

/** Parse da URL da página (sem coordenadas). */
export function parseMarketplaceQuery(params: URLSearchParams): MarketplaceQuery {
  const typeRaw = params.get("type") ?? params.get("tab");
  const radius = clampRadiusKm(parsePositiveNumber(params.get("radiusKm")));
  const prices = clampPriceRange(parsePositiveNumber(params.get("minPrice")), parsePositiveNumber(params.get("maxPrice")));
  const inStock = boolFromParam(params.get("inStock"));
  const near = boolFromParam(params.get("near")) === true;
  return {
    q: params.get("q")?.trim() || undefined,
    type: parseMarketplaceType(typeRaw),
    category: params.get("category") || params.get("cat") || undefined,
    ...prices,
    minRating: parsePositiveNumber(params.get("minRating")),
    verifiedOnly: boolFromParam(params.get("verifiedOnly")) ?? boolFromParam(params.get("verified")),
    freeShipping: MARKETPLACE_FEATURES.freeShipping ? boolFromParam(params.get("freeShipping")) : undefined,
    promoOnly: boolFromParam(params.get("promoOnly")) ?? boolFromParam(params.get("promo")),
    inStock: inStock === undefined ? true : inStock,
    homeService: boolFromParam(params.get("homeService")),
    telehealth: boolFromParam(params.get("telehealth")),
    openToday: boolFromParam(params.get("openToday")),
    species: normalizeSpecies(params.get("species")),
    brand: params.get("brand") || undefined,
    city: params.get("city")?.trim() || undefined,
    group: params.get("group") || undefined,
    sort: parseMarketplaceSort(params.get("sort")),
    near,
    radiusKm: near ? radius ?? MARKETPLACE_DEFAULT_RADIUS_KM : radius,
    page: parsePositiveNumber(params.get("page")),
    pageSize: parsePositiveNumber(params.get("pageSize")),
  };
}

/** Serializa estado compartilhavel — nunca inclui lat/lng. */
export function serializeMarketplaceQuery(query: MarketplaceQuery): URLSearchParams {
  const q = new URLSearchParams();
  if (query.q) q.set("q", query.q);
  if (query.type && query.type !== "all") q.set("type", query.type);
  if (query.category) q.set("category", query.category);
  if (query.minPrice != null) q.set("minPrice", String(query.minPrice));
  if (query.maxPrice != null) q.set("maxPrice", String(query.maxPrice));
  if (query.minRating != null && query.minRating > 0) q.set("minRating", String(query.minRating));
  if (query.verifiedOnly) q.set("verifiedOnly", "true");
  if (MARKETPLACE_FEATURES.freeShipping && query.freeShipping) q.set("freeShipping", "true");
  if (query.promoOnly) q.set("promoOnly", "true");
  if (query.inStock === false) q.set("inStock", "false");
  if (query.homeService) q.set("homeService", "true");
  if (query.telehealth) q.set("telehealth", "true");
  if (query.openToday) q.set("openToday", "true");
  if (query.species) q.set("species", query.species);
  if (query.brand) q.set("brand", query.brand);
  if (query.city) q.set("city", query.city);
  if (query.group) q.set("group", query.group);
  if (query.sort && query.sort !== "relevance") q.set("sort", query.sort);
  if (query.near) q.set("near", "1");
  if (query.near) {
    q.set("radiusKm", String(query.radiusKm ?? MARKETPLACE_DEFAULT_RADIUS_KM));
  } else if (query.radiusKm != null) {
    q.set("radiusKm", String(query.radiusKm));
  }
  if (query.page && query.page > 1) q.set("page", String(query.page));
  return q;
}

export function marketplaceQueryString(query: MarketplaceQuery): string {
  const s = serializeMarketplaceQuery(query).toString();
  return s ? `?${s}` : "";
}

export function countActiveMarketplaceFilters(query: MarketplaceQuery): number {
  let n = 0;
  if (query.q) n += 1;
  if (query.category) n += 1;
  if (query.minPrice != null || query.maxPrice != null) n += 1;
  if (query.minRating) n += 1;
  if (query.verifiedOnly) n += 1;
  if (query.freeShipping) n += 1;
  if (query.promoOnly) n += 1;
  if (query.inStock === false) n += 1;
  if (query.homeService) n += 1;
  if (query.telehealth) n += 1;
  if (query.openToday) n += 1;
  if (query.species) n += 1;
  if (query.near) n += 1;
  if (query.city) n += 1;
  if (query.group) n += 1;
  return n;
}

export type GeoForApi = { lat?: number; lng?: number };

/**
 * Query string para APIs internas. lat/lng só entram aqui (request), nunca na URL da página.
 */
export function buildMarketplaceApiQuery(query: MarketplaceQuery, geo?: GeoForApi): string {
  const params = serializeMarketplaceQuery(query);
  if (query.type === "product") params.set("tab", "products");
  if (query.type === "service") params.set("tab", "services");
  if (query.type === "partner") params.set("tab", "partners");
  if (geo?.lat != null && geo?.lng != null) {
    params.set("lat", String(geo.lat));
    params.set("lng", String(geo.lng));
  }
  if (query.near && !params.has("radiusKm")) {
    params.set("radiusKm", String(query.radiusKm ?? MARKETPLACE_DEFAULT_RADIUS_KM));
  }
  if (query.sort === "near_me") params.set("sort", "near_me");
  if (query.pageSize) params.set("pageSize", String(query.pageSize));
  const s = params.toString();
  return s ? `?${s}` : "";
}

export function formatDistanceKm(km: number): string {
  if (!Number.isFinite(km) || km < 0) return "";
  if (km < 1) return `${Math.round(km * 10) / 10} km`.replace(".", ",");
  if (km < 10) return `${(Math.round(km * 10) / 10).toLocaleString("pt-BR")} km`;
  return `${Math.round(km).toLocaleString("pt-BR")} km`;
}

/** Bucket ~1 km — usado em cache key, nunca coordenada exata. */
export function locationBucket(lat: number, lng: number): string {
  return `${lat.toFixed(2)},${lng.toFixed(2)}`;
}

export function marketplaceCacheKey(query: MarketplaceQuery, geo?: GeoForApi): string {
  const bucket = geo?.lat != null && geo?.lng != null ? locationBucket(geo.lat, geo.lng) : "";
  return ["marketplace", serializeMarketplaceQuery(query).toString(), bucket].filter(Boolean).join("|");
}

export function mergeMarketplaceQuery(base: MarketplaceQuery, patch: Partial<MarketplaceQuery>): MarketplaceQuery {
  const next = { ...base, ...patch, page: patch.page ?? 1 };
  if (patch.near === false) {
    next.near = false;
    if (patch.radiusKm === undefined) next.radiusKm = undefined;
    if (patch.sort === undefined && base.sort === "near_me") next.sort = "relevance";
  }
  if (patch.near === true && !next.sort) next.sort = "near_me";
  if (patch.near === true && next.radiusKm == null) next.radiusKm = MARKETPLACE_DEFAULT_RADIUS_KM;
  const prices = clampPriceRange(next.minPrice, next.maxPrice);
  next.minPrice = prices.minPrice;
  next.maxPrice = prices.maxPrice;
  return next;
}
