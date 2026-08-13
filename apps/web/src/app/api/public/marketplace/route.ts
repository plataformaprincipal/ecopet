import { apiSuccess } from "@/lib/api-response";
import { queryPublicProducts, queryPublicServices, type PublicSort } from "@/lib/marketplace/public-query";

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

const SORTS: PublicSort[] = ["relevance", "newest", "price_asc", "price_desc", "popular", "rating"];

function sortParam(value: string | null): PublicSort | undefined {
  if (!value) return undefined;
  return SORTS.includes(value as PublicSort) ? (value as PublicSort) : undefined;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const q = url.searchParams.get("q") ?? undefined;
  const category = url.searchParams.get("category") ?? undefined;
  const tab = url.searchParams.get("tab") ?? "all";
  const sort = sortParam(url.searchParams.get("sort"));
  const minRating = numParam(url.searchParams.get("minRating"));
  const minPrice = numParam(url.searchParams.get("minPrice"));
  const maxPrice = numParam(url.searchParams.get("maxPrice"));
  const pageSize = numParam(url.searchParams.get("pageSize")) ?? 24;

  const productFilters = {
    q,
    category,
    minPrice,
    maxPrice,
    minRating,
    inStock: boolParam(url.searchParams.get("inStock")),
    sort,
    pageSize,
  };

  const serviceFilters = {
    q,
    category: url.searchParams.get("serviceCategory") ?? undefined,
    minPrice,
    maxPrice,
    minRating,
    sort,
    pageSize: Math.min(pageSize, 12),
  };

  const [products, services] = await Promise.all([
    tab === "services" ? Promise.resolve({ products: [], total: 0 }) : queryPublicProducts(productFilters),
    tab === "products" ? Promise.resolve({ services: [], total: 0 }) : queryPublicServices(serviceFilters),
  ]);

  return apiSuccess({
    products: products.products,
    services: services.services,
    totalProducts: products.total,
    totalServices: services.total,
  });
}
