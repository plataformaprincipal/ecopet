import { apiSuccess, apiFailure } from "@/lib/api-response";
import { queryPublicProducts } from "@/lib/marketplace/public-query";
import { parseCatalogRequest } from "@/lib/marketplace/parse-request";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const parsed = parseCatalogRequest(url);
  if ((url.searchParams.has("lat") || url.searchParams.has("lng")) && (parsed.lat == null || parsed.lng == null)) {
    return apiFailure("VALIDATION", "Coordenadas inválidas.", 400);
  }

  const result = await queryPublicProducts({
    q: parsed.q,
    category: parsed.productCategory,
    species: parsed.species,
    brand: parsed.brand,
    city: parsed.city,
    state: parsed.state,
    partnerId: parsed.partnerId,
    minPrice: parsed.minPrice,
    maxPrice: parsed.maxPrice,
    minRating: parsed.minRating,
    inStock: parsed.inStock,
    verifiedOnly: parsed.verifiedOnly,
    freeShipping: parsed.freeShipping,
    promoOnly: parsed.promoOnly,
    lat: parsed.lat,
    lng: parsed.lng,
    radiusKm: parsed.radiusKm,
    sort: parsed.sort,
    page: parsed.page,
    pageSize: parsed.pageSize,
  });

  return apiSuccess(result);
}
