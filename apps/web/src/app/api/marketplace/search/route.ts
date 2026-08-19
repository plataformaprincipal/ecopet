import { apiSuccess, apiFailure } from "@/lib/api-response";
import { queryPublicProducts, queryPublicServices, queryPublicPartners } from "@/lib/marketplace/public-query";
import { parseCatalogRequest } from "@/lib/marketplace/parse-request";
import { parseMarketplaceType } from "@/lib/marketplace/query-model";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const parsed = parseCatalogRequest(url);
  if ((url.searchParams.has("lat") || url.searchParams.has("lng")) && (parsed.lat == null || parsed.lng == null)) {
    return apiFailure("VALIDATION", "Coordenadas inválidas.", 400);
  }

  const type = parseMarketplaceType(parsed.tab);
  const pageSize = parsed.pageSize ?? 24;
  const common = {
    q: parsed.q,
    city: parsed.city,
    state: parsed.state,
    minPrice: parsed.minPrice,
    maxPrice: parsed.maxPrice,
    minRating: parsed.minRating,
    verifiedOnly: parsed.verifiedOnly,
    lat: parsed.lat,
    lng: parsed.lng,
    radiusKm: parsed.radiusKm,
    sort: parsed.sort,
    page: 1,
    pageSize,
  };

  const [products, services, partners] = await Promise.all([
    type === "service" || type === "partner"
      ? Promise.resolve({ products: [], total: 0 })
      : queryPublicProducts({
          ...common,
          category: parsed.productCategory,
          species: parsed.species,
          brand: parsed.brand,
          partnerId: parsed.partnerId,
          inStock: parsed.inStock,
          freeShipping: parsed.freeShipping,
          promoOnly: parsed.promoOnly,
        }),
    type === "product" || type === "partner"
      ? Promise.resolve({ services: [], total: 0 })
      : queryPublicServices({
          ...common,
          category: parsed.serviceCategory,
          species: parsed.species,
          partnerId: parsed.partnerId,
          homeService: parsed.homeService,
          telehealth: parsed.telehealth,
          emergency24h: parsed.emergency24h,
          openToday: parsed.openToday,
          group: parsed.group,
        }),
    type === "product" || type === "service"
      ? Promise.resolve({ partners: [], total: 0 })
      : queryPublicPartners({
          ...common,
          category: parsed.categoryParam,
        }),
  ]);

  return apiSuccess({
    products: products.products,
    services: services.services,
    partners: partners.partners,
    total: products.total + services.total + partners.total,
    totalProducts: products.total,
    totalServices: services.total,
    totalPartners: partners.total,
  });
}
