import { AccountStatus, VerificationStatus, type Prisma } from "@prisma/client";
import type { MarketplaceQuery } from "./query-model";
import { MARKETPLACE_FEATURES, normalizeSpecies, parseMarketplaceSort, parsePositiveNumber } from "./query-model";
import { productCategoryFromSlug, serviceCategoryFromSlug } from "./categories";
import { isValidLatLng } from "@/lib/google-maps/validation";

export function numParam(value: string | null) {
  return parsePositiveNumber(value);
}

export function boolParam(value: string | null): boolean | undefined {
  if (value === "true" || value === "1") return true;
  if (value === "false" || value === "0") return false;
  return undefined;
}

export function parseCatalogRequest(url: URL) {
  const lat = numParam(url.searchParams.get("lat"));
  const lng = numParam(url.searchParams.get("lng"));
  const geoValid =
    lat != null && lng != null && isValidLatLng({ lat, lng }) ? { lat, lng } : { lat: undefined, lng: undefined };

  const categoryParam = url.searchParams.get("category") ?? url.searchParams.get("cat") ?? undefined;
  const minPrice = numParam(url.searchParams.get("minPrice"));
  const maxPrice = numParam(url.searchParams.get("maxPrice"));
  const rawRadius = numParam(url.searchParams.get("radiusKm"));
  const near = boolParam(url.searchParams.get("near")) === true;

  return {
    q: url.searchParams.get("q")?.trim() || undefined,
    categoryParam,
    productCategory: categoryParam ? productCategoryFromSlug(categoryParam) ?? categoryParam : undefined,
    serviceCategory: categoryParam ? serviceCategoryFromSlug(categoryParam) ?? categoryParam : undefined,
    species: normalizeSpecies(url.searchParams.get("species")),
    brand: url.searchParams.get("brand") ?? undefined,
    city: url.searchParams.get("city") ?? undefined,
    state: url.searchParams.get("state") ?? undefined,
    partnerId: url.searchParams.get("partnerId") ?? undefined,
    minPrice,
    maxPrice,
    minRating: numParam(url.searchParams.get("minRating")),
    inStock: boolParam(url.searchParams.get("inStock")),
    verifiedOnly: boolParam(url.searchParams.get("verifiedOnly")) ?? boolParam(url.searchParams.get("verified")) === true,
    freeShipping: MARKETPLACE_FEATURES.freeShipping && boolParam(url.searchParams.get("freeShipping")) === true,
    promoOnly: boolParam(url.searchParams.get("promoOnly")) ?? boolParam(url.searchParams.get("promo")) === true,
    homeService: boolParam(url.searchParams.get("homeService")) === true,
    telehealth: boolParam(url.searchParams.get("telehealth")) === true,
    emergency24h: boolParam(url.searchParams.get("emergency24h")) === true,
    openToday: boolParam(url.searchParams.get("openToday")) === true,
    group: url.searchParams.get("group") ?? undefined,
    ...geoValid,
    radiusKm: rawRadius == null ? undefined : Math.min(200, Math.max(1, rawRadius)),
    near,
    sort: parseMarketplaceSort(url.searchParams.get("sort")),
    page: numParam(url.searchParams.get("page")),
    pageSize: numParam(url.searchParams.get("pageSize")),
    tab: url.searchParams.get("tab") ?? url.searchParams.get("type") ?? "all",
  };
}

/** Filtro real de parceiro verificado. Sem verifiedOnly, não exige APPROVED. */
export function publicVerificationWhere(verifiedOnly?: boolean): Prisma.PartnerProfileWhereInput {
  if (!verifiedOnly) return {};
  return {
    verificationStatus: VerificationStatus.APPROVED,
    approvedAt: { not: null },
  };
}

export const publicPartnerAccountWhere: Prisma.UserWhereInput = {
  role: "PARTNER",
  accountStatus: { notIn: [AccountStatus.SUSPENDED, AccountStatus.REJECTED] },
};

export function toQueryHint(q: MarketplaceQuery) {
  return q;
}
