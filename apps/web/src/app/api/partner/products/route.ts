import { prisma } from "@/lib/prisma";
import { apiSuccess, apiFailure } from "@/lib/api-response";
import { requireActivePartner, requireApprovedPartner } from "@/lib/auth/require-auth";
import { productSchema } from "@/schemas/product";
import { ContentApprovalStatus, Prisma, ProductCatalogStatus } from "@prisma/client";

function buildProductData(sellerId: string, data: z.infer<typeof productSchema>) {
  const status = data.status ?? ProductCatalogStatus.ACTIVE;
  return {
    sellerId,
    name: data.name.trim(),
    description: data.description.trim(),
    shortDescription: data.shortDescription?.trim() ?? null,
    subcategory: data.subcategory?.trim() ?? null,
    catalogCategory: data.catalogCategory,
    brand: data.brand ?? null,
    speciesTarget: data.speciesTarget ?? null,
    price: data.price,
    comparePrice: data.comparePrice ?? null,
    stock: data.stock,
    minStock: data.minStock ?? 0,
    unit: data.unit ?? null,
    sku: data.sku ?? null,
    barcode: data.barcode ?? null,
    weightGrams: data.weightGrams ?? null,
    dimensions: data.dimensions ?? undefined,
    tags: data.tags ?? undefined,
    pickupAvailable: data.pickupAvailable ?? true,
    deliveryAvailable: data.deliveryAvailable ?? true,
    extraDetails: data.extraDetails ?? undefined,
    status,
    images: data.images ?? undefined,
    approvalStatus: ContentApprovalStatus.APPROVED,
  };
}

import type { z } from "zod";

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
  const { user, error } = await requireApprovedPartner();
  if (error) return error;

  const parsed = productSchema.safeParse(await request.json());
  if (!parsed.success) {
    return apiFailure("VALIDATION", parsed.error.errors[0]?.message ?? "Inválido", 400);
  }

  const data = parsed.data;
  const product = await prisma.$transaction(async (tx) => {
    const created = await tx.product.create({ data: buildProductData(user!.id, data) });
    if (created.stock > 0) {
      await tx.inventoryLog.create({
        data: {
          productId: created.id,
          partnerId: user!.id,
          delta: created.stock,
          stockAfter: created.stock,
          reason: "Estoque inicial",
          actorId: user!.id,
        },
      });
    }
    return created;
  });

  return apiSuccess({ product }, 201);
}
