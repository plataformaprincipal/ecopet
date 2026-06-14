import { AccountStatus, ProductCatalogStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiFailure } from "@/lib/api-response";

type RouteContext = { params: Promise<{ productId: string }> };

export async function GET(_req: Request, context: RouteContext) {
  const { productId } = await context.params;

  const product = await prisma.product.findFirst({
    where: {
      id: productId,
      deletedAt: null,
      status: ProductCatalogStatus.ACTIVE,
      approvalStatus: "APPROVED",
      seller: { accountStatus: AccountStatus.ACTIVE, role: "PARTNER" },
    },
    include: {
      seller: {
        select: {
          id: true,
          name: true,
          partnerProfile: { select: { businessName: true, city: true, state: true } },
        },
      },
      reviews: {
        where: { moderationStatus: "VISIBLE" },
        select: { rating: true, comment: true, createdAt: true, user: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
        take: 20,
      },
    },
  });

  if (!product) return apiFailure("NOT_FOUND", "Produto não encontrado.", 404);

  const { reviews, ...rest } = product;
  return apiSuccess({ product: { ...rest, reviews } });
}
