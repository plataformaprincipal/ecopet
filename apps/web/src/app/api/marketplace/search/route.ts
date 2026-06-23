import { apiSuccess } from "@/lib/api-response";
import { queryPublicProducts, queryPublicServices, queryPublicPartners } from "@/lib/marketplace/public-query";
import { productCategoryFromSlug, serviceCategoryFromSlug } from "@/lib/marketplace/categories";

function numParam(value: string | null) {
  if (!value) return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const q = url.searchParams.get("q") ?? undefined;
  const categoryParam = url.searchParams.get("category") ?? undefined;
  const productCategory = categoryParam ? productCategoryFromSlug(categoryParam) ?? categoryParam : undefined;
  const serviceCategory = categoryParam ? serviceCategoryFromSlug(categoryParam) ?? categoryParam : undefined;

  const common = {
    q,
    city: url.searchParams.get("city") ?? undefined,
    state: url.searchParams.get("state") ?? undefined,
    minPrice: numParam(url.searchParams.get("minPrice")),
    maxPrice: numParam(url.searchParams.get("maxPrice")),
    page: 1,
    pageSize: numParam(url.searchParams.get("pageSize")) ?? 24,
  };

  const [products, services, partners] = await Promise.all([
    queryPublicProducts({ ...common, category: productCategory }),
    queryPublicServices({ ...common, category: serviceCategory }),
    queryPublicPartners(common),
  ]);

  return apiSuccess({
    products: products.products,
    services: services.services,
    partners: partners.partners,
    total: products.total + services.total + partners.total,
  });
}
