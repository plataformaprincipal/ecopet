import { apiSuccess } from "@/lib/api-response";
import { queryPublicServices } from "@/lib/marketplace/public-query";

function numParam(value: string | null) {
  if (!value) return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const result = await queryPublicServices({
    q: url.searchParams.get("q") ?? undefined,
    category: url.searchParams.get("category") ?? undefined,
    species: url.searchParams.get("species") ?? undefined,
    city: url.searchParams.get("city") ?? undefined,
    state: url.searchParams.get("state") ?? undefined,
    partnerId: url.searchParams.get("partnerId") ?? undefined,
    minPrice: numParam(url.searchParams.get("minPrice")),
    maxPrice: numParam(url.searchParams.get("maxPrice")),
    page: numParam(url.searchParams.get("page")),
    pageSize: numParam(url.searchParams.get("pageSize")),
  });

  return apiSuccess(result);
}
