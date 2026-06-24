import { GET as getMarketplaceProduct } from "@/app/api/marketplace/products/[id]/route";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: Request, context: RouteContext) {
  const { id } = await context.params;
  return getMarketplaceProduct(request, { params: Promise.resolve({ id }) });
}
