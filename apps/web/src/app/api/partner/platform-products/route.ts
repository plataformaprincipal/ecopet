import { prisma } from "@/lib/prisma";
import { apiSuccess } from "@/lib/api-response";
import { requireActivePartner } from "@/lib/auth/require-auth";
import { ProductCatalogStatus } from "@prisma/client";

async function getPlatformSellerIds(): Promise<string[]> {
  const ecopetOrg = await prisma.organization.findFirst({
    where: { type: "ECOPET", isActive: true },
    select: {
      members: { select: { userId: true } },
      users: { select: { id: true } },
    },
  });

  const memberIds = ecopetOrg?.members.map((m) => m.userId) ?? [];
  const orgUserIds = ecopetOrg?.users.map((u) => u.id) ?? [];

  const adminIds = await prisma.user.findMany({
    where: { role: "ADMIN" },
    select: { id: true },
  });

  return [...new Set([...memberIds, ...orgUserIds, ...adminIds.map((a) => a.id)])];
}

export async function GET() {
  const { user, error } = await requireActivePartner();
  if (error) return error;

  const platformSellerIds = await getPlatformSellerIds();

  if (platformSellerIds.length === 0) {
    return apiSuccess({ products: [], total: 0 });
  }

  const products = await prisma.product.findMany({
    where: {
      sellerId: { in: platformSellerIds.filter((id) => id !== user!.id) },
      deletedAt: null,
      status: ProductCatalogStatus.ACTIVE,
      approvalStatus: "APPROVED",
    },
    orderBy: [{ isFeatured: "desc" }, { updatedAt: "desc" }],
    take: 50,
    select: {
      id: true,
      name: true,
      price: true,
      stock: true,
      catalogCategory: true,
      images: true,
      shortDescription: true,
      brand: true,
      status: true,
      approvalStatus: true,
    },
  });

  return apiSuccess({ products, total: products.length });
}
