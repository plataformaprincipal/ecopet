import { apiSuccess, apiFailure } from "@/lib/api-response";
import { AccountStatus, ProductCatalogStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: RouteContext) {
  const { id } = await params;
  const product = await prisma.product.findFirst({
    where: {
      id,
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
    },
  });
  if (!product) return apiFailure("NOT_FOUND", "Produto não encontrado.", 404);
  return apiSuccess({ product });
}
