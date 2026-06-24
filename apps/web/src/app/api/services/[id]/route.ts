import { GET as getMarketplaceService } from "@/app/api/marketplace/services/[id]/route";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: Request, context: RouteContext) {
  const { id } = await context.params;
  return getMarketplaceService(request, { params: Promise.resolve({ id }) });
}
