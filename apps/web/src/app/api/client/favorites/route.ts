import { prisma } from "@/lib/prisma";
import { apiSuccess, apiFailure } from "@/lib/api-response";
import { requireClient } from "@/lib/auth/require-auth";
import { ProductCatalogStatus } from "@prisma/client";

export async function GET() {
  const { user, error } = await requireClient();
  if (error) return error;

  const favorites = await prisma.favorite.findMany({
    where: { userId: user!.id, productId: { not: null } },
    include: {
      product: {
        select: {
          id: true,
          name: true,
          price: true,
          images: true,
          catalogCategory: true,
          stock: true,
          status: true,
          approvalStatus: true,
          deletedAt: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 300,
  });

  const products = favorites
    .map((f) => f.product)
    .filter(
      (p) =>
        p &&
        !p.deletedAt &&
        p.status === ProductCatalogStatus.ACTIVE &&
        p.approvalStatus === "APPROVED" &&
        p.stock > 0
    );

  return apiSuccess({ productIds: products.map((p) => p!.id), products, total: products.length });
}

export async function POST(request: Request) {
  const { user, error } = await requireClient();
  if (error) return error;

  const body = await request.json();
  const productId = typeof body.productId === "string" ? body.productId : null;
  if (!productId) {
    return apiFailure("VALIDATION", "Informe productId.", 400);
  }

  const product = await prisma.product.findFirst({
    where: {
      id: productId,
      deletedAt: null,
      status: ProductCatalogStatus.ACTIVE,
      approvalStatus: "APPROVED",
    },
  });
  if (!product) {
    return apiFailure("NOT_FOUND", "Produto não disponível.", 404);
  }

  const existing = await prisma.favorite.findFirst({
    where: { userId: user!.id, productId },
  });

  if (existing) {
    await prisma.favorite.delete({ where: { id: existing.id } });
    return apiSuccess({ favorited: false, productId });
  }

  await prisma.favorite.create({
    data: { userId: user!.id, productId },
  });

  return apiSuccess({ favorited: true, productId }, 201);
}
