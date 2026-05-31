import type {
  MarketplaceProduct,
  MarketplaceService,
  MarketplacePartner,
  MarketplaceReview,
  AiRecommendation,
  SubscriptionPlan,
  MarketplaceFilters,
} from "./types";
import {
  MOCK_PRODUCTS,
  MOCK_SERVICES,
  MOCK_PARTNERS,
  MOCK_REVIEWS,
  MOCK_AI_RECOMMENDATIONS,
  MOCK_SUBSCRIPTIONS,
  getProductById,
  getServiceById,
  getPartnerById,
  getProductsByPartner,
  getServicesByPartner,
  getReviewsForTarget,
  getRelatedProducts,
  getRelatedServices,
} from "./mock-data";

const DELAY = 500;

async function delay<T>(data: T): Promise<T> {
  await new Promise((r) => setTimeout(r, DELAY));
  return data;
}

/** Futuro: GET /api/marketplace/products */
export async function fetchProducts(_filters?: Partial<MarketplaceFilters>): Promise<MarketplaceProduct[]> {
  return delay([...MOCK_PRODUCTS]);
}

/** Futuro: GET /api/marketplace/services */
export async function fetchServices(_filters?: Partial<MarketplaceFilters>): Promise<MarketplaceService[]> {
  return delay([...MOCK_SERVICES]);
}

/** Futuro: GET /api/marketplace/partners */
export async function fetchPartners(): Promise<MarketplacePartner[]> {
  return delay([...MOCK_PARTNERS]);
}

export async function fetchProduct(id: string) {
  return delay(getProductById(id));
}

export async function fetchService(id: string) {
  return delay(getServiceById(id));
}

export async function fetchPartner(id: string) {
  return delay(getPartnerById(id));
}

export async function fetchPartnerProducts(partnerId: string) {
  return delay(getProductsByPartner(partnerId));
}

export async function fetchPartnerServices(partnerId: string) {
  return delay(getServicesByPartner(partnerId));
}

export async function fetchReviews(targetId: string) {
  return delay(getReviewsForTarget(targetId));
}

export async function fetchAiRecommendations() {
  return delay([...MOCK_AI_RECOMMENDATIONS]);
}

export async function fetchSubscriptions() {
  return delay([...MOCK_SUBSCRIPTIONS]);
}

export async function fetchRelatedProducts(productId: string) {
  return delay(getRelatedProducts(productId));
}

export async function fetchRelatedServices(serviceId: string) {
  return delay(getRelatedServices(serviceId));
}

export async function searchMarketplace(query: string, filters?: Partial<MarketplaceFilters>) {
  const q = query.toLowerCase();
  const products = MOCK_PRODUCTS.filter(
    (p) => !q || p.name.toLowerCase().includes(q) || p.category.includes(q) || p.brand?.toLowerCase().includes(q)
  );
  const services = MOCK_SERVICES.filter(
    (s) => !q || s.name.toLowerCase().includes(q) || s.category.includes(q)
  );
  const partners = MOCK_PARTNERS.filter(
    (p) => !q || p.name.toLowerCase().includes(q) || p.categories.some((c) => c.toLowerCase().includes(q))
  );
  return delay({ products, services, partners, filters });
}

export { MOCK_PRODUCTS, MOCK_SERVICES, MOCK_PARTNERS, MOCK_AI_RECOMMENDATIONS, MOCK_SUBSCRIPTIONS };
