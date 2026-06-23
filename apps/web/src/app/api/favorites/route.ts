import { ProductCatalogStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiFailure } from "@/lib/api-response";
import { requireAuth } from "@/lib/auth/require-auth";

export async function GET() {
  const { user, error } = await requireAuth();
  if (error) return error;

  const favorites = await prisma.favorite.findMany({
    where: { userId: user!.id },
    orderBy: { createdAt: "desc" },
  });

  const productIds = favorites.map((f) => f.productId).filter(Boolean) as string[];
  const products = productIds.length
    ? await prisma.product.findMany({
        where: {
          id: { in: productIds },
          deletedAt: null,
          status: ProductCatalogStatus.ACTIVE,
          approvalStatus: "APPROVED",
          stock: { gt: 0 },
        },
        select: { id: true, name: true, price: true, images: true, catalogCategory: true },
      })
    : [];

  return apiSuccess({
    productIds: products.map((p) => p.id),
    serviceIds: [] as string[],
    partnerIds: [] as string[],
    products,
    services: [],
    partners: [],
    total: favorites.length,
  });
}

export async function POST(request: Request) {
  const { user, error } = await requireAuth();
  if (error) return error;

  const body = await request.json();
  const productId = typeof body.productId === "string" ? body.productId : null;
  const serviceId = typeof body.serviceId === "string" ? body.serviceId : null;
  const partnerId = typeof body.partnerId === "string" ? body.partnerId : null;

  if (!productId && !serviceId && !partnerId) {
    return apiFailure("VALIDATION", "Informe productId, serviceId ou partnerId.", 400);
  }

  if (productId) {
    const product = await prisma.product.findFirst({
      where: { id: productId, deletedAt: null, status: ProductCatalogStatus.ACTIVE, approvalStatus: "APPROVED" },
    });
    if (!product) return apiFailure("NOT_FOUND", "Produto não disponível.", 404);

    const existing = await prisma.favorite.findFirst({ where: { userId: user!.id, productId } });
    if (existing) {
      await prisma.favorite.delete({ where: { id: existing.id } });
      return apiSuccess({ favorited: false, productId });
    }
    await prisma.favorite.create({ data: { userId: user!.id, productId } });
    return apiSuccess({ favorited: true, productId }, 201);
  }

  if (serviceId) {
    const service = await prisma.service.findFirst({
      where: { id: serviceId, deletedAt: null, status: "ACTIVE", isActive: true },
    });
    if (!service) return apiFailure("NOT_FOUND", "Serviço não disponível.", 404);
    // serviceId favorito: persist via metadata em postId placeholder até migration aplicada
    const marker = `service:${serviceId}`;
    const existing = await prisma.favorite.findFirst({ where: { userId: user!.id, postId: marker } });
    if (existing) {
      await prisma.favorite.delete({ where: { id: existing.id } });
      return apiSuccess({ favorited: false, serviceId });
    }
    await prisma.favorite.create({ data: { userId: user!.id, postId: marker } });
    return apiSuccess({ favorited: true, serviceId }, 201);
  }

  const partner = await prisma.user.findFirst({
    where: { id: partnerId!, role: "PARTNER", accountStatus: "ACTIVE" },
  });
  if (!partner) return apiFailure("NOT_FOUND", "Parceiro não encontrado.", 404);

  const marker = `partner:${partnerId}`;
  const existing = await prisma.favorite.findFirst({ where: { userId: user!.id, postId: marker } });
  if (existing) {
    await prisma.favorite.delete({ where: { id: existing.id } });
    return apiSuccess({ favorited: false, partnerId });
  }
  await prisma.favorite.create({ data: { userId: user!.id, postId: marker } });
  return apiSuccess({ favorited: true, partnerId }, 201);
}
