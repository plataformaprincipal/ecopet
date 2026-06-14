import { getPublicPartner } from "@/lib/marketplace/public-query";
import { apiSuccess, apiFailure } from "@/lib/api-response";

type RouteContext = { params: Promise<{ partnerId: string }> };

export async function GET(_req: Request, context: RouteContext) {
  const { partnerId } = await context.params;
  const partner = await getPublicPartner(partnerId);
  if (!partner) return apiFailure("NOT_FOUND", "Parceiro não encontrado.", 404);
  return apiSuccess({ partner });
}
