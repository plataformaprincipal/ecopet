import { api } from "@/lib/api";
import type {
  MarketplaceProduct,
  MarketplaceService,
  MarketplacePartner,
  MarketplaceFilters,
} from "./types";

type ApiProduct = {
  id: string;
  name: string;
  description: string;
  price: number;
  comparePrice?: number | null;
  images?: string[];
  stock: number;
  rating: number;
  reviewCount: number;
  isSponsored?: boolean;
  sellerId: string;
  seller: { id: string; name: string; isVerified: boolean };
  category?: { name: string; slug: string } | null;
};

type ApiService = {
  id: string;
  name: string;
  description: string;
  price: number;
  rating: number;
  category: string;
  durationMin?: number | null;
  image?: string | null;
  providerId: string;
  provider: { id: string; name: string; isVerified: boolean };
};

function slugify(name: string) {
  return name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, "-");
}

function mapProduct(p: ApiProduct): MarketplaceProduct {
  const images = p.images?.length ? p.images : [];
  return {
    id: p.id,
    name: p.name,
    slug: slugify(p.name),
    description: p.description,
    category: p.category?.slug ?? "geral",
    price: p.price,
    comparePrice: p.comparePrice ?? undefined,
    images,
    rating: p.rating,
    reviewCount: p.reviewCount,
    partnerId: p.sellerId,
    partner: {
      id: p.seller.id,
      name: p.seller.name,
      avatar: "",
      isVerified: p.seller.isVerified,
      location: "",
    },
    inStock: p.stock > 0,
    deliveryDays: 3,
    freeShipping: p.price >= 99,
    isPromo: !!p.comparePrice && p.comparePrice > p.price,
    isSponsored: p.isSponsored,
  };
}

function mapService(s: ApiService): MarketplaceService {
  return {
    id: s.id,
    name: s.name,
    slug: slugify(s.name),
    description: s.description,
    category: s.category.toLowerCase(),
    price: s.price,
    image: s.image ?? "",
    rating: s.rating,
    reviewCount: 0,
    partnerId: s.providerId,
    partner: {
      id: s.provider.id,
      name: s.provider.name,
      avatar: "",
      isVerified: s.provider.isVerified,
      location: "",
      distanceKm: 0,
    },
    durationMin: s.durationMin ?? 60,
    homeService: true,
    inPerson: true,
    telehealth: false,
  };
}

function partnerFromProducts(products: ApiProduct[]): MarketplacePartner[] {
  const map = new Map<string, MarketplacePartner>();
  for (const p of products) {
    if (map.has(p.sellerId)) continue;
    map.set(p.sellerId, {
      id: p.seller.id,
      type: "petshop",
      name: p.seller.name,
      tradeName: p.seller.name,
      avatar: "",
      cover: "",
      description: "",
      location: "",
      distanceKm: 0,
      rating: p.rating,
      reviewCount: p.reviewCount,
      salesCount: 0,
      responseTime: "",
      isVerified: p.seller.isVerified,
      categories: [p.category?.name ?? "Produtos"],
      hours: "",
      policies: {},
      portfolio: [],
    });
  }
  return [...map.values()];
}

export async function fetchProducts(_filters?: Partial<MarketplaceFilters>, token?: string): Promise<MarketplaceProduct[]> {
  try {
    const rows = await api<ApiProduct[]>("/api/products", token ? { token } : undefined);
    return rows.map(mapProduct);
  } catch {
    return [];
  }
}

export async function fetchServices(_filters?: Partial<MarketplaceFilters>, token?: string): Promise<MarketplaceService[]> {
  try {
    const rows = await api<ApiService[]>("/api/services", token ? { token } : undefined);
    return rows.map(mapService);
  } catch {
    return [];
  }
}

export async function fetchPartners(token?: string): Promise<MarketplacePartner[]> {
  try {
    const products = await api<ApiProduct[]>("/api/products", token ? { token } : undefined);
    return partnerFromProducts(products);
  } catch {
    return [];
  }
}

export async function fetchProduct(id: string, token?: string): Promise<MarketplaceProduct | undefined> {
  try {
    const p = await api<ApiProduct>(`/api/products/${id}`, token ? { token } : undefined);
    return mapProduct(p);
  } catch {
    return undefined;
  }
}

export async function fetchService(id: string, token?: string): Promise<MarketplaceService | undefined> {
  try {
    const services = await api<ApiService[]>("/api/services", token ? { token } : undefined);
    const s = services.find((x) => x.id === id);
    return s ? mapService(s) : undefined;
  } catch {
    return undefined;
  }
}

export async function fetchPartner(id: string, token?: string): Promise<MarketplacePartner | undefined> {
  const partners = await fetchPartners(token);
  return partners.find((p) => p.id === id);
}

export async function fetchPartnerProducts(partnerId: string, token?: string) {
  const products = await fetchProducts(undefined, token);
  return products.filter((p) => p.partnerId === partnerId);
}

export async function fetchPartnerServices(partnerId: string, token?: string) {
  const services = await fetchServices(undefined, token);
  return services.filter((s) => s.partnerId === partnerId);
}

export async function fetchReviews(_targetId: string) {
  return [];
}

export async function fetchAiRecommendations() {
  return [];
}

export async function fetchSubscriptions() {
  return [];
}

export async function fetchRelatedProducts(productId: string, token?: string) {
  const products = await fetchProducts(undefined, token);
  return products.filter((p) => p.id !== productId).slice(0, 4);
}

export async function fetchRelatedServices(serviceId: string, token?: string) {
  const services = await fetchServices(undefined, token);
  return services.filter((s) => s.id !== serviceId).slice(0, 4);
}

export async function searchMarketplace(query: string, filters?: Partial<MarketplaceFilters>, token?: string) {
  const q = query.toLowerCase();
  const [products, services, partners] = await Promise.all([
    fetchProducts(filters, token),
    fetchServices(filters, token),
    fetchPartners(token),
  ]);
  return {
    products: products.filter((p) => !q || p.name.toLowerCase().includes(q) || p.category.includes(q)),
    services: services.filter((s) => !q || s.name.toLowerCase().includes(q)),
    partners: partners.filter((p) => !q || p.name.toLowerCase().includes(q)),
    filters,
  };
}
