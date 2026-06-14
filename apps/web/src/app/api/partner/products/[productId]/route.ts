import { prisma } from "@/lib/prisma";
import { apiSuccess, apiFailure } from "@/lib/api-response";
import { requireActivePartner } from "@/lib/auth/require-auth";
import { productSchema } from "@/schemas/product";
import { Prisma, ProductCatalogStatus } from "@prisma/client";

type RouteContext = { params: Promise<{ productId: string }> };

export async function GET(_req: Request, context: RouteContext) {
  const { user, error } = await requireActivePartner();
  if (error) return error;
  const { productId } = await context.params;

  const product = await prisma.product.findFirst({
    where: { id: productId, sellerId: user!.id, deletedAt: null },
  });
  if (!product) return apiFailure("NOT_FOUND", "Produto não encontrado.", 404);
  return apiSuccess({ product });
}

export async function PUT(request: Request, context: RouteContext) {
  const { user, error } = await requireActivePartner();
  if (error) return error;
  const { productId } = await context.params;

  const existing = await prisma.product.findFirst({
    where: { id: productId, sellerId: user!.id, deletedAt: null },
  });
  if (!existing) return apiFailure("NOT_FOUND", "Produto não encontrado.", 404);

  const parsed = productSchema.partial().safeParse(await request.json());
  if (!parsed.success) {
    return apiFailure("VALIDATION", parsed.error.errors[0]?.message ?? "Inválido", 400);
  }
  const data = parsed.data;

  const product = await prisma.product.update({
    where: { id: productId },
    data: {
      ...(data.name !== undefined ? { name: data.name.trim() } : {}),
      ...(data.description !== undefined ? { description: data.description.trim() } : {}),
      ...(data.catalogCategory !== undefined ? { catalogCategory: data.catalogCategory } : {}),
      ...(data.brand !== undefined ? { brand: data.brand } : {}),
      ...(data.speciesTarget !== undefined ? { speciesTarget: data.speciesTarget } : {}),
      ...(data.price !== undefined ? { price: data.price } : {}),
      ...(data.comparePrice !== undefined ? { comparePrice: data.comparePrice } : {}),
      ...(data.stock !== undefined ? { stock: data.stock } : {}),
      ...(data.sku !== undefined ? { sku: data.sku } : {}),
      ...(data.barcode !== undefined ? { barcode: data.barcode } : {}),
      ...(data.weightGrams !== undefined ? { weightGrams: data.weightGrams } : {}),
      ...(data.status !== undefined ? { status: data.status } : {}),
      ...(data.images !== undefined
        ? { images: data.images === null ? Prisma.JsonNull : data.images }
        : {}),
      approvalStatus: "PENDING",
    },
  });

  return apiSuccess({ product });
}

export async function DELETE(_req: Request, context: RouteContext) {
  const { user, error } = await requireActivePartner();
  if (error) return error;
  const { productId } = await context.params;

  const existing = await prisma.product.findFirst({
    where: { id: productId, sellerId: user!.id, deletedAt: null },
  });
  if (!existing) return apiFailure("NOT_FOUND", "Produto não encontrado.", 404);

  await prisma.product.update({
    where: { id: productId },
    data: { deletedAt: new Date(), status: ProductCatalogStatus.INACTIVE },
  });

  return apiSuccess({ message: "Produto removido." });
}
