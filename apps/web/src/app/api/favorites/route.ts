import { ProductCatalogStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiFailure } from "@/lib/api-response";
import { requireAuth } from "@/lib/auth/require-auth";

function uniqueIds(values: Array<string | null | undefined>) {
  return [...new Set(values.filter((v): v is string => Boolean(v)))];
}

export async function GET() {
  const { user, error } = await requireAuth();
  if (error) return error;

  const favorites = await prisma.favorite.findMany({
    where: { userId: user!.id },
    orderBy: { createdAt: "desc" },
    take: 300,
  });

  const productIds = uniqueIds(favorites.map((f) => f.productId));
  const serviceIds = uniqueIds([
    ...favorites.map((f) => f.serviceId),
    ...favorites
      .map((f) => f.postId)
      .filter((id): id is string => Boolean(id?.startsWith("service:")))
      .map((id) => id.slice("service:".length)),
  ]);
  const partnerIds = uniqueIds([
    ...favorites.map((f) => f.partnerId),
    ...favorites
      .map((f) => f.postId)
      .filter((id): id is string => Boolean(id?.startsWith("partner:")))
      .map((id) => id.slice("partner:".length)),
  ]);

  const [products, services, partners] = await Promise.all([
    productIds.length
      ? prisma.product.findMany({
          where: {
            id: { in: productIds },
            deletedAt: null,
            status: ProductCatalogStatus.ACTIVE,
            approvalStatus: "APPROVED",
          },
          select: { id: true, name: true, price: true, images: true, catalogCategory: true },
        })
      : Promise.resolve([]),
    serviceIds.length
      ? prisma.service.findMany({
          where: { id: { in: serviceIds }, deletedAt: null, status: "ACTIVE", isActive: true },
          select: { id: true, name: true, price: true, image: true, category: true },
        })
      : Promise.resolve([]),
    partnerIds.length
      ? prisma.user.findMany({
          where: { id: { in: partnerIds }, role: "PARTNER" },
          select: {
            id: true,
            name: true,
            avatarUrl: true,
            partnerProfile: { select: { businessName: true, city: true, state: true } },
          },
        })
      : Promise.resolve([]),
  ]);

  return apiSuccess({
    productIds: products.map((p) => p.id),
    serviceIds: services.map((s) => s.id),
    partnerIds: partners.map((p) => p.id),
    products,
    services,
    partners: partners.map((p) => ({
      id: p.id,
      name: p.partnerProfile?.businessName || p.name,
      avatarUrl: p.avatarUrl,
      city: p.partnerProfile?.city ?? null,
      state: p.partnerProfile?.state ?? null,
    })),
    total: products.length + services.length + partners.length,
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
    const existing = await prisma.favorite.findFirst({
      where: { userId: user!.id, OR: [{ serviceId }, { postId: `service:${serviceId}` }] },
    });
    if (existing) {
      await prisma.favorite.delete({ where: { id: existing.id } });
      return apiSuccess({ favorited: false, serviceId });
    }
    await prisma.favorite.create({ data: { userId: user!.id, serviceId } });
    return apiSuccess({ favorited: true, serviceId }, 201);
  }

  const partner = await prisma.user.findFirst({
    where: { id: partnerId!, role: "PARTNER" },
  });
  if (!partner) return apiFailure("NOT_FOUND", "Parceiro não encontrado.", 404);

  const existing = await prisma.favorite.findFirst({
    where: { userId: user!.id, OR: [{ partnerId }, { postId: `partner:${partnerId}` }] },
  });
  if (existing) {
    await prisma.favorite.delete({ where: { id: existing.id } });
    return apiSuccess({ favorited: false, partnerId });
  }
  await prisma.favorite.create({ data: { userId: user!.id, partnerId } });
  return apiSuccess({ favorited: true, partnerId }, 201);
}
