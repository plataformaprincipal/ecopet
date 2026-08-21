import { apiSuccess } from "@/lib/api-response";
import { requireAuth } from "@/lib/auth/require-auth";
import { searchMarketplaceProducts } from "@/lib/ai-commerce/marketplace-search";
import { handleAiCommerceError } from "@/lib/ai-commerce/http";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { error } = await requireAuth();
  if (error) return error;
  const q = new URL(request.url).searchParams.get("q") ?? "";
  try {
    const products = await searchMarketplaceProducts({ query: q, take: 6 });
    return apiSuccess({ products });
  } catch (e) {
    return handleAiCommerceError(e);
  }
}
