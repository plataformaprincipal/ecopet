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
  const images = p.images?.length ? p.images : ["https://images.unsplash.com/photo-1583337130817-17825daae963?w=400"];
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
      avatar: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=200",
      isVerified: p.seller.isVerified,
      location: "Brasil",
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
    image: s.image ?? "https://images.unsplash.com/photo-1628009365241-1a4b7857f757?w=400",
    rating: s.rating,
    reviewCount: 0,
    partnerId: s.providerId,
    partner: {
      id: s.provider.id,
      name: s.provider.name,
      avatar: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=200",
      isVerified: s.provider.isVerified,
      location: "Brasil",
      distanceKm: 2.5,
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
      avatar: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=200",
      cover: "https://images.unsplash.com/photo-1450778869180-41d0601e046e?w=800",
      description: `Parceiro ECOPET — ${p.seller.name}`,
      location: "Brasil",
      distanceKm: 2.5,
      rating: 4.8,
      reviewCount: 12,
      salesCount: 50,
      responseTime: "< 2h",
      isVerified: p.seller.isVerified,
      categories: [p.category?.name ?? "Produtos"],
      hours: "Seg–Sáb 9h–18h",
      policies: {},
      portfolio: [],
    });
  }
  return [...map.values()];
}

export async function fetchProducts(_filters?: Partial<MarketplaceFilters>, token?: string): Promise<MarketplaceProduct[]> {
  try {
    const rows = await api<ApiProduct[]>("/api/products", { token });
    return rows.map(mapProduct);
  } catch {
    const { MOCK_PRODUCTS } = await import("./mock-data");
    return [...MOCK_PRODUCTS];
  }
}

export async function fetchServices(_filters?: Partial<MarketplaceFilters>, token?: string): Promise<MarketplaceService[]> {
  try {
    const rows = await api<ApiService[]>("/api/services", { token });
    return rows.map(mapService);
  } catch {
    const { MOCK_SERVICES } = await import("./mock-data");
    return [...MOCK_SERVICES];
  }
}

export async function fetchPartners(token?: string): Promise<MarketplacePartner[]> {
  try {
    const products = await api<ApiProduct[]>("/api/products", { token });
    return partnerFromProducts(products);
  } catch {
    const { MOCK_PARTNERS } = await import("./mock-data");
    return [...MOCK_PARTNERS];
  }
}

export async function fetchProduct(id: string, token?: string) {
  try {
    const p = await api<ApiProduct>(`/api/products/${id}`, { token });
    return mapProduct(p);
  } catch {
    const { getProductById } = await import("./mock-data");
    return getProductById(id);
  }
}

export async function fetchService(id: string) {
  try {
    const services = await api<ApiService[]>("/api/services");
    const s = services.find((x) => x.id === id);
    if (!s) throw new Error("not found");
    return mapService(s);
  } catch {
    const { getServiceById } = await import("./mock-data");
    return getServiceById(id);
  }
}

export async function fetchPartner(id: string, token?: string) {
  const partners = await fetchPartners(token);
  return partners.find((p) => p.id === id) ?? partners[0];
}

export async function fetchPartnerProducts(partnerId: string, token?: string) {
  const products = await fetchProducts(undefined, token);
  return products.filter((p) => p.partnerId === partnerId);
}

export async function fetchPartnerServices(partnerId: string) {
  const services = await fetchServices();
  return services.filter((s) => s.partnerId === partnerId);
}

export async function fetchReviews(_targetId: string) {
  return [];
}

export async function fetchAiRecommendations() {
  const { MOCK_AI_RECOMMENDATIONS } = await import("./mock-data");
  return [...MOCK_AI_RECOMMENDATIONS];
}

export async function fetchSubscriptions() {
  const { MOCK_SUBSCRIPTIONS } = await import("./mock-data");
  return [...MOCK_SUBSCRIPTIONS];
}

export async function fetchRelatedProducts(productId: string, token?: string) {
  const products = await fetchProducts(undefined, token);
  return products.filter((p) => p.id !== productId).slice(0, 4);
}

export async function fetchRelatedServices(serviceId: string) {
  const services = await fetchServices();
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

export { MOCK_PRODUCTS, MOCK_SERVICES, MOCK_PARTNERS, MOCK_AI_RECOMMENDATIONS, MOCK_SUBSCRIPTIONS } from "./mock-data";
