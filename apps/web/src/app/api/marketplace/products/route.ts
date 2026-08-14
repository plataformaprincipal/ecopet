import { apiSuccess, apiFailure } from "@/lib/api-response";
import { queryPublicProducts } from "@/lib/marketplace/public-query";
import { productCategoryFromSlug } from "@/lib/marketplace/categories";
import { isValidLatLng } from "@/lib/google-maps/validation";

function numParam(value: string | null) {
  if (!value) return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

function boolParam(value: string | null) {
  if (value === "true") return true;
  if (value === "false") return false;
  return undefined;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const categoryParam = url.searchParams.get("category") ?? undefined;
  const category = categoryParam ? (productCategoryFromSlug(categoryParam) ?? categoryParam) : undefined;

  const lat = numParam(url.searchParams.get("lat"));
  const lng = numParam(url.searchParams.get("lng"));
  if ((lat != null || lng != null) && (lat == null || lng == null || !isValidLatLng({ lat, lng }))) {
    return apiFailure("VALIDATION", "Coordenadas inválidas.", 400);
  }
  const rawRadius = numParam(url.searchParams.get("radiusKm"));
  const radiusKm = rawRadius == null ? undefined : Math.min(200, Math.max(1, rawRadius));

  const result = await queryPublicProducts({
    q: url.searchParams.get("q") ?? undefined,
    category,
    species: url.searchParams.get("species") ?? undefined,
    brand: url.searchParams.get("brand") ?? undefined,
    city: url.searchParams.get("city") ?? undefined,
    state: url.searchParams.get("state") ?? undefined,
    partnerId: url.searchParams.get("partnerId") ?? undefined,
    minPrice: numParam(url.searchParams.get("minPrice")),
    maxPrice: numParam(url.searchParams.get("maxPrice")),
    minRating: numParam(url.searchParams.get("minRating")),
    inStock: boolParam(url.searchParams.get("inStock")),
    lat,
    lng,
    radiusKm,
    sort: (url.searchParams.get("sort") as never) ?? undefined,
    page: numParam(url.searchParams.get("page")),
    pageSize: numParam(url.searchParams.get("pageSize")),
  });

  return apiSuccess(result);
}
