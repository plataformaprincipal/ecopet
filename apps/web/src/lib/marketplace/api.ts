import { marketplaceFetch } from "@/lib/marketplace/fetch-api";
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
  latitude?: number | null;
  longitude?: number | null;
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
    images: images.length ? images : ["/images/placeholder-product.png"],
    rating: p.rating,
    reviewCount: p.reviewCount,
    partnerId: p.sellerId,
    partner: {
      id: p.seller.id,
      name: partnerName,
      avatar: "",
      isVerified: true,
      location,
    },
    inStock: p.stock > 0,
    deliveryDays: 3,
    freeShipping: p.price >= 99,
    isPromo: !!p.comparePrice && p.comparePrice > p.price,
    isSponsored: p.isFeatured ?? false,
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
    image: s.image ?? "/images/placeholder-service.png",
    rating: s.rating,
    reviewCount: s.reviewCount,
    partnerId: s.providerId,
    partner: {
      id: s.provider.id,
      name: partnerName,
      avatar: "",
      isVerified: true,
      location,
      distanceKm: 0,
    },
    durationMin: s.durationMin ?? 60,
    homeService: s.modality === "HOME" || s.modality === "PICKUP_DELIVERY",
    inPerson: s.modality === "IN_PERSON" || !s.modality,
    telehealth: s.modality === "ONLINE",
    emergency: s.category === "EMERGENCY_24H",
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
    rating: 0,
    reviewCount: 0,
    salesCount: p.productCount,
    responseTime: "",
    isVerified: true,
    categories: p.category ? [p.category] : ["Parceiro"],
    hours: "",
    policies: {},
    portfolio: [],
    productCount: p.productCount,
    serviceCount: p.serviceCount,
  };
}

function buildQuery(filters?: Partial<MarketplaceFilters>, extra?: Record<string, string>) {
  const params = new URLSearchParams();
  if (filters?.query) params.set("q", filters.query);
  if (filters?.category) params.set("category", filters.category);
  if (filters?.location) params.set("city", filters.location);
  if (filters?.partnerId) params.set("partnerId", filters.partnerId);
  if (filters?.city) params.set("city", filters.city);
  if (filters?.state) params.set("state", filters.state);
  if (filters?.priceMin != null && filters.priceMin > 0) params.set("minPrice", String(filters.priceMin));
  if (filters?.priceMax != null) params.set("maxPrice", String(filters.priceMax));
  if (filters?.minRating != null && filters.minRating > 0) params.set("minRating", String(filters.minRating));
  if (filters?.inStock) params.set("inStock", "true");
  if (filters?.telehealth || filters?.onlineOnly) params.set("telehealth", "true");
  if (filters?.emergency24h) params.set("emergency24h", "true");
  if (extra) {
    for (const [k, v] of Object.entries(extra)) params.set(k, v);
  }
  const qs = params.toString();
  return qs ? `?${qs}` : "";
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
      isVerified: true,
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
