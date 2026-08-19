import { apiSuccess } from "@/lib/api-response";
import { queryPublicProducts, queryPublicServices } from "@/lib/marketplace/public-query";
import { parseCatalogRequest } from "@/lib/marketplace/parse-request";
import { parseMarketplaceType } from "@/lib/marketplace/query-model";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const parsed = parseCatalogRequest(url);
  const type = parseMarketplaceType(parsed.tab);
  const pageSize = parsed.pageSize ?? 24;

  const productFilters = {
    q: parsed.q,
    category: parsed.productCategory,
    minPrice: parsed.minPrice,
    maxPrice: parsed.maxPrice,
    minRating: parsed.minRating,
    inStock: parsed.inStock,
    verifiedOnly: parsed.verifiedOnly,
    promoOnly: parsed.promoOnly,
    species: parsed.species,
    brand: parsed.brand,
    city: parsed.city,
    state: parsed.state,
    lat: parsed.lat,
    lng: parsed.lng,
    radiusKm: parsed.radiusKm,
    sort: parsed.sort,
    pageSize,
  };

  const serviceFilters = {
    q: parsed.q,
    category: parsed.serviceCategory,
    minPrice: parsed.minPrice,
    maxPrice: parsed.maxPrice,
    minRating: parsed.minRating,
    verifiedOnly: parsed.verifiedOnly,
    species: parsed.species,
    city: parsed.city,
    state: parsed.state,
    homeService: parsed.homeService,
    telehealth: parsed.telehealth,
    emergency24h: parsed.emergency24h,
    openToday: parsed.openToday,
    group: parsed.group,
    lat: parsed.lat,
    lng: parsed.lng,
    radiusKm: parsed.radiusKm,
    sort: parsed.sort,
    pageSize: Math.min(pageSize, 12),
  };

  const [products, services] = await Promise.all([
    type === "service" ? Promise.resolve({ products: [], total: 0 }) : queryPublicProducts(productFilters),
    type === "product" ? Promise.resolve({ services: [], total: 0 }) : queryPublicServices(serviceFilters),
  ]);

  return apiSuccess({
    products: products.products,
    services: services.services,
    totalProducts: products.total,
    totalServices: services.total,
  });
}
