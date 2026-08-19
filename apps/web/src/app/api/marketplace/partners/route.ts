import { apiSuccess, apiFailure } from "@/lib/api-response";
import { queryPublicPartners } from "@/lib/marketplace/public-query";
import { parseCatalogRequest } from "@/lib/marketplace/parse-request";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const parsed = parseCatalogRequest(url);
  if ((url.searchParams.has("lat") || url.searchParams.has("lng")) && (parsed.lat == null || parsed.lng == null)) {
    return apiFailure("VALIDATION", "Coordenadas inválidas.", 400);
  }

  const result = await queryPublicPartners({
    q: parsed.q,
    category: parsed.categoryParam,
    city: parsed.city,
    state: parsed.state,
    page: parsed.page,
    pageSize: parsed.pageSize,
    lat: parsed.lat,
    lng: parsed.lng,
    radiusKm: parsed.radiusKm,
    verifiedOnly: parsed.verifiedOnly,
    minRating: parsed.minRating,
    sort: parsed.sort,
  });
  return apiSuccess(result);
}
