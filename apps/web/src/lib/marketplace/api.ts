import { productImageFallback, serviceImageFallback, resolveMediaUrl } from "@/lib/media/fallbacks";
import { marketplaceFetch } from "@/lib/marketplace/fetch-api";
import { buildMarketplaceApiQuery, type MarketplaceQuery, type GeoForApi } from "./query-model";
import type {
  MarketplaceProduct,
  MarketplaceService,
  MarketplacePartner,
  MarketplaceFilters,
  MarketplaceReview,
} from "./types";

type PublicProductRow = {
  id: string;
  name: string;
  slug?: string | null;
  description: string;
  shortDescription?: string | null;
  subcategory?: string | null;
  catalogCategory?: string | null;
  brand?: string | null;
  price: number;
  comparePrice?: number | null;
  images?: unknown;
  stock: number;
  rating: number;
  reviewCount: number;
  isFeatured?: boolean;
  isSponsored?: boolean;
  isVerified?: boolean;
  isPromo?: boolean;
  distanceKm?: number | null;
  shippingCost?: number | null;
  speciesTarget?: string | null;
  sellerId: string;
  seller: {
    id: string;
    name: string;
    partnerProfile?: { businessName?: string | null; city?: string | null; state?: string | null } | null;
  };
};

type PublicServiceRow = {
  id: string;
  name: string;
  description: string;
  shortDescription?: string | null;
  category: string;
  price: number;
  durationMin?: number | null;
  image?: string | null;
  rating: number;
  reviewCount: number;
  modality?: string | null;
  city?: string | null;
  state?: string | null;
  isVerified?: boolean;
  distanceKm?: number | null;
  speciesTarget?: string | null;
  openToday?: boolean;
  providerId: string;
  provider: {
    id: string;
    name: string;
    partnerProfile?: { businessName?: string | null; city?: string | null; state?: string | null } | null;
  };
};

type PublicPartnerRow = {
  id: string;
  name: string;
  description?: string | null;
  city?: string | null;
  state?: string | null;
  category?: string | null;
  productCount: number;
  serviceCount: number;
  rating?: number;
  reviewCount?: number;
  isVerified?: boolean;
  distanceKm?: number | null;
};

function parseImages(raw: unknown): string[] {
  if (Array.isArray(raw)) return raw.filter((x): x is string => typeof x === "string");
  if (typeof raw === "string" && raw) return [raw];
  return [];
}

function slugify(name: string) {
  return name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, "-");
}

function mapProduct(p: PublicProductRow): MarketplaceProduct {
  const images = parseImages(p.images);
  const partnerName = p.seller.partnerProfile?.businessName ?? p.seller.name;
  const location = [p.seller.partnerProfile?.city, p.seller.partnerProfile?.state].filter(Boolean).join(", ");
  const fallback = productImageFallback(p.catalogCategory);
  const resolvedImages = images.length
    ? images.map((url) => resolveMediaUrl(url, fallback))
    : [fallback];
  return {
    id: p.id,
    name: p.name,
    slug: p.slug ?? slugify(p.name),
    description: p.shortDescription ?? p.description,
    longDescription: p.description,
    category: (p.catalogCategory ?? "OTHER").toLowerCase(),
    subcategory: p.subcategory ?? undefined,
    brand: p.brand ?? undefined,
    price: p.price,
    comparePrice: p.comparePrice ?? undefined,
    images: resolvedImages,
    rating: p.rating,
    reviewCount: p.reviewCount,
    partnerId: p.sellerId,
    partner: {
      id: p.seller.id,
      name: partnerName,
      avatar: "",
      isVerified: Boolean(p.isVerified),
      location,
      distanceKm: p.distanceKm ?? 0,
    },
    inStock: p.stock > 0,
    deliveryDays: undefined,
    freeShipping: false,
    isPromo: p.isPromo ?? (!!p.comparePrice && p.comparePrice > p.price),
    isSponsored: p.isSponsored ?? p.isFeatured ?? false,
    distanceKm: p.distanceKm ?? null,
    shippingCost: p.shippingCost ?? null,
    speciesTarget: p.speciesTarget ?? undefined,
    species: p.speciesTarget ? [p.speciesTarget] : undefined,
  };
}

function mapService(s: PublicServiceRow): MarketplaceService {
  const partnerName = s.provider.partnerProfile?.businessName ?? s.provider.name;
  const location = [s.city ?? s.provider.partnerProfile?.city, s.state ?? s.provider.partnerProfile?.state]
    .filter(Boolean)
    .join(", ");
  return {
    id: s.id,
    name: s.name,
    slug: slugify(s.name),
    description: s.description,
    category: s.category.toLowerCase(),
    price: s.price,
    image: resolveMediaUrl(s.image, serviceImageFallback(s.category)),
    rating: s.rating,
    reviewCount: s.reviewCount,
    partnerId: s.providerId,
    partner: {
      id: s.provider.id,
      name: partnerName,
      avatar: "",
      isVerified: Boolean(s.isVerified),
      location,
      distanceKm: s.distanceKm ?? 0,
    },
    distanceKm: s.distanceKm ?? null,
    speciesTarget: s.speciesTarget ?? undefined,
    durationMin: s.durationMin ?? 60,
    homeService: s.modality === "HOME" || s.modality === "PICKUP_DELIVERY",
    inPerson: s.modality === "IN_PERSON" || !s.modality,
    telehealth: s.modality === "ONLINE",
    emergency: s.category === "EMERGENCY_24H",
    openToday: Boolean(s.openToday),
  };
}

function mapPartner(p: PublicPartnerRow): MarketplacePartner {
  return {
    id: p.id,
    type: "petshop",
    name: p.name,
    tradeName: p.name,
    avatar: "",
    cover: "",
    description: p.description ?? "",
    location: [p.city, p.state].filter(Boolean).join(", "),
    distanceKm: p.distanceKm ?? 0,
    rating: p.rating ?? 0,
    reviewCount: p.reviewCount ?? 0,
    salesCount: p.productCount,
    responseTime: "",
    isVerified: Boolean(p.isVerified),
    categories: p.category ? [p.category] : ["Parceiro"],
    hours: "",
    policies: {},
    portfolio: [],
    productCount: p.productCount,
    serviceCount: p.serviceCount,
  };
}

function legacyFiltersToQuery(filters?: Partial<MarketplaceFilters>): MarketplaceQuery {
  const sortRaw = filters?.sort;
  const sort =
    sortRaw === "distance"
      ? "near_me"
      : sortRaw === "bestseller"
        ? "popular"
        : sortRaw === "ai"
          ? "relevance"
          : sortRaw;
  return {
    q: filters?.query || undefined,
    category: filters?.category || undefined,
    minPrice: filters?.priceMin && filters.priceMin > 0 ? filters.priceMin : undefined,
    maxPrice: filters?.priceMax && filters.priceMax > 0 && filters.priceMax < 2000 ? filters.priceMax : undefined,
    minRating: filters?.minRating && filters.minRating > 0 ? filters.minRating : undefined,
    verifiedOnly: filters?.verifiedOnly || undefined,
    promoOnly: filters?.promoOnly || undefined,
    inStock: filters?.inStock,
    homeService: filters?.homeService || filters?.homeServiceOnly || undefined,
    species: filters?.species || undefined,
    brand: filters?.brand || undefined,
    city: filters?.city || filters?.location || undefined,
    sort: sort && sort !== "relevance" ? (sort as MarketplaceQuery["sort"]) : "relevance",
    near: Boolean(filters?.lat && filters?.lng),
    radiusKm: filters?.radiusKm ?? (filters?.lat != null ? filters.maxDistance : undefined),
  };
}

function buildQuery(filters?: Partial<MarketplaceFilters>, extra?: Record<string, string>, geo?: GeoForApi) {
  const query = legacyFiltersToQuery(filters);
  const params = new URLSearchParams(
    buildMarketplaceApiQuery(query, geo ?? { lat: filters?.lat, lng: filters?.lng }).replace(/^\?/, "")
  );
  if (filters?.partnerId) params.set("partnerId", filters.partnerId);
  if (filters?.state) params.set("state", filters.state);
  if (filters?.telehealth || filters?.onlineOnly) params.set("telehealth", "true");
  if (filters?.emergency24h) params.set("emergency24h", "true");
  if (extra) {
    for (const [k, v] of Object.entries(extra)) params.set(k, v);
  }
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

export async function fetchMarketplaceCatalog(query: MarketplaceQuery, geo?: GeoForApi) {
  const qs = buildMarketplaceApiQuery(query, geo);
  if (query.type === "product") {
    const data = await marketplaceFetch<{ products: PublicProductRow[]; total: number; page: number; totalPages: number }>(
      `/api/marketplace/products${qs}`
    );
    return { products: data.products.map(mapProduct), services: [] as MarketplaceService[], partners: [] as MarketplacePartner[], total: data.total, totalPages: data.totalPages, page: data.page };
  }
  if (query.type === "service") {
    const data = await marketplaceFetch<{ services: PublicServiceRow[]; total: number; page: number; totalPages: number }>(
      `/api/marketplace/services${qs}`
    );
    return { products: [] as MarketplaceProduct[], services: data.services.map(mapService), partners: [] as MarketplacePartner[], total: data.total, totalPages: data.totalPages, page: data.page };
  }
  if (query.type === "partner") {
    const data = await marketplaceFetch<{ partners: PublicPartnerRow[]; total: number; page: number; totalPages: number }>(
      `/api/marketplace/partners${qs}`
    );
    return { products: [] as MarketplaceProduct[], services: [] as MarketplaceService[], partners: data.partners.map(mapPartner), total: data.total, totalPages: data.totalPages, page: data.page };
  }
  const data = await marketplaceFetch<{
    products: PublicProductRow[];
    services: PublicServiceRow[];
    partners: PublicPartnerRow[];
    total: number;
    totalProducts?: number;
    totalServices?: number;
    totalPartners?: number;
  }>(`/api/marketplace/search${qs}`);
  const total =
    data.total ??
    (data.totalProducts ?? data.products.length) + (data.totalServices ?? data.services.length) + (data.totalPartners ?? data.partners.length);
  return {
    products: data.products.map(mapProduct),
    services: data.services.map(mapService),
    partners: data.partners.map(mapPartner),
    total,
    totalPages: 1,
    page: 1,
  };
}

export async function fetchProducts(filters?: Partial<MarketplaceFilters>): Promise<MarketplaceProduct[]> {
  const data = await marketplaceFetch<{ products: PublicProductRow[] }>(
    `/api/marketplace/products${buildQuery(filters)}`
  );
  return data.products.map(mapProduct);
}

export async function fetchServices(filters?: Partial<MarketplaceFilters>): Promise<MarketplaceService[]> {
  const data = await marketplaceFetch<{ services: PublicServiceRow[] }>(
    `/api/marketplace/services${buildQuery(filters)}`
  );
  return data.services.map(mapService);
}

export async function fetchPartners(filters?: Partial<MarketplaceFilters>): Promise<MarketplacePartner[]> {
  const data = await marketplaceFetch<{ partners: PublicPartnerRow[] }>(
    `/api/marketplace/partners${buildQuery(filters)}`
  );
  return data.partners.map(mapPartner);
}

export async function fetchProduct(id: string): Promise<MarketplaceProduct | undefined> {
  try {
    const data = await marketplaceFetch<{ product: PublicProductRow }>(`/api/marketplace/products/${id}`);
    return mapProduct(data.product);
  } catch {
    return undefined;
  }
}

export async function fetchService(id: string): Promise<MarketplaceService | undefined> {
  try {
    const data = await marketplaceFetch<{ service: PublicServiceRow }>(`/api/marketplace/services/${id}`);
    return mapService(data.service);
  } catch {
    return undefined;
  }
}

export async function fetchPartner(id: string): Promise<MarketplacePartner | undefined> {
  try {
    const data = await marketplaceFetch<{ partner: Record<string, unknown> }>(`/api/marketplace/partners/${id}`);
    const p = data.partner;
    return {
      id: String(p.id),
      type: "petshop",
      name: String(p.businessName ?? p.name ?? ""),
      tradeName: String(p.businessName ?? ""),
      avatar: "",
      cover: "",
      description: String(p.description ?? ""),
      location: [p.city, p.state].filter(Boolean).join(", "),
      distanceKm: 0,
      rating: Number(p.rating ?? 0),
      reviewCount: Number(p.reviewCount ?? 0),
      salesCount: Array.isArray(p.products) ? p.products.length : 0,
      responseTime: "",
      isVerified: Boolean(p.isVerified),
      categories: p.category ? [String(p.category)] : [],
      hours: String(p.businessHours ?? ""),
      policies: {},
      portfolio: [],
    };
  } catch {
    return undefined;
  }
}

export async function fetchPartnerProducts(partnerId: string) {
  return fetchProducts({ partnerId } as Partial<MarketplaceFilters>);
}

export async function fetchPartnerServices(partnerId: string) {
  return fetchServices({ partnerId } as Partial<MarketplaceFilters>);
}

export async function fetchReviews(targetId: string, type: "product" | "service" = "product"): Promise<MarketplaceReview[]> {
  try {
    const param = type === "product" ? `productId=${targetId}` : `serviceId=${targetId}`;
    const data = await marketplaceFetch<{ reviews: Array<{ id: string; rating: number; comment?: string | null; createdAt: string; user: { name: string }; partnerReply?: string | null }> }>(
      `/api/reviews?${param}`
    );
    return data.reviews.map((r) => ({
      id: r.id,
      targetId,
      targetType: type,
      rating: r.rating,
      comment: r.comment ?? "",
      author: r.user.name,
      avatar: "",
      createdAt: r.createdAt,
      partnerReply: r.partnerReply ?? undefined,
    }));
  } catch {
    return [];
  }
}

export async function fetchRelatedProducts(productId: string) {
  const products = await fetchProducts();
  return products.filter((p) => p.id !== productId).slice(0, 4);
}

export async function fetchRelatedServices(serviceId: string) {
  const services = await fetchServices();
  return services.filter((s) => s.id !== serviceId).slice(0, 4);
}

export async function searchMarketplace(query: string, filters?: Partial<MarketplaceFilters>) {
  const data = await marketplaceFetch<{
    products: PublicProductRow[];
    services: PublicServiceRow[];
    partners: PublicPartnerRow[];
  }>(`/api/marketplace/search${buildQuery({ ...filters, query })}`);
  return {
    products: data.products.map(mapProduct),
    services: data.services.map(mapService),
    partners: data.partners.map(mapPartner),
    filters,
  };
}

export async function fetchAiRecommendations(): Promise<import("./types").AiRecommendation[]> {
  const products = await fetchProducts();
  return products.filter((p) => p.isSponsored).slice(0, 6).map((p) => ({
    id: `rec-${p.id}`,
    tag: "best_value" as const,
    title: p.name,
    subtitle: p.partner.name,
    itemType: "product" as const,
    itemId: p.id,
    image: p.images[0],
    href: `/marketplace/produto/${p.id}`,
  }));
}

export async function fetchSubscriptions() {
  return [];
}
