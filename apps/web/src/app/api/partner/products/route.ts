import { prisma } from "@/lib/prisma";
import { apiSuccess, apiFailure } from "@/lib/api-response";
import { requireActivePartner } from "@/lib/auth/require-auth";
import { productSchema } from "@/schemas/product";
import { ProductCatalogStatus } from "@prisma/client";

export async function GET() {
  const { user, error } = await requireActivePartner();
  if (error) return error;

  const products = await prisma.product.findMany({
    where: { sellerId: user!.id, deletedAt: null },
    orderBy: { updatedAt: "desc" },
  });

  return apiSuccess({ products, total: products.length });
}

export async function POST(request: Request) {
  const { user, error } = await requireActivePartner();
  if (error) return error;

  const parsed = productSchema.safeParse(await request.json());
  if (!parsed.success) {
    return apiFailure("VALIDATION", parsed.error.errors[0]?.message ?? "Inválido", 400);
  }

  const data = parsed.data;
  const product = await prisma.product.create({
    data: {
      sellerId: user!.id,
      name: data.name.trim(),
      description: data.description.trim(),
      catalogCategory: data.catalogCategory,
      brand: data.brand ?? null,
      speciesTarget: data.speciesTarget ?? null,
      price: data.price,
      comparePrice: data.comparePrice ?? null,
      stock: data.stock,
      sku: data.sku ?? null,
      barcode: data.barcode ?? null,
      weightGrams: data.weightGrams ?? null,
      status: data.status ?? ProductCatalogStatus.DRAFT,
      images: data.images ?? undefined,
      approvalStatus: "PENDING",
    },
  });

  return apiSuccess({ product }, 201);
}
