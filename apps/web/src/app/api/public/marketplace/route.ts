import { apiSuccess } from "@/lib/api-response";
import { queryPublicProducts, queryPublicServices } from "@/lib/marketplace/public-query";

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
  const q = url.searchParams.get("q") ?? undefined;
  const category = url.searchParams.get("category") ?? undefined;
  const tab = url.searchParams.get("tab") ?? "all";

  const productFilters = {
    q,
    category,
    minPrice: numParam(url.searchParams.get("minPrice")),
    maxPrice: numParam(url.searchParams.get("maxPrice")),
    inStock: boolParam(url.searchParams.get("inStock")),
    pageSize: numParam(url.searchParams.get("pageSize")) ?? 24,
  };

  const serviceFilters = {
    q,
    category: url.searchParams.get("serviceCategory") ?? undefined,
    minPrice: numParam(url.searchParams.get("minPrice")),
    maxPrice: numParam(url.searchParams.get("maxPrice")),
    pageSize: numParam(url.searchParams.get("pageSize")) ?? 12,
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
