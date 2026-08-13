import { apiSuccess } from "@/lib/api-response";
import { queryPublicProducts } from "@/lib/marketplace/public-query";

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
  const sortRaw = url.searchParams.get("sort");
  const sort =
    sortRaw === "relevance" ||
    sortRaw === "newest" ||
    sortRaw === "price_asc" ||
    sortRaw === "price_desc" ||
    sortRaw === "popular" ||
    sortRaw === "rating"
      ? sortRaw
      : undefined;

  const result = await queryPublicProducts({
    q: url.searchParams.get("q") ?? undefined,
    category: url.searchParams.get("category") ?? undefined,
    species: url.searchParams.get("species") ?? undefined,
    brand: url.searchParams.get("brand") ?? undefined,
    city: url.searchParams.get("city") ?? undefined,
    state: url.searchParams.get("state") ?? undefined,
    partnerId: url.searchParams.get("partnerId") ?? undefined,
    minPrice: numParam(url.searchParams.get("minPrice")),
    maxPrice: numParam(url.searchParams.get("maxPrice")),
    minRating: numParam(url.searchParams.get("minRating")),
    inStock: boolParam(url.searchParams.get("inStock")),
    sort,
    page: numParam(url.searchParams.get("page")),
    pageSize: numParam(url.searchParams.get("pageSize")),
  });

  return apiSuccess(result);
}
