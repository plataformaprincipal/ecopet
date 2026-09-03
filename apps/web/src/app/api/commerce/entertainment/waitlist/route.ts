import { apiFailure, apiSuccess } from "@/lib/api-response";
import { requireAuth } from "@/lib/auth/require-auth";
import { prisma } from "@/lib/prisma";
import { ENTERTAINMENT_SKU } from "@/lib/commerce-catalog/products";

export const dynamic = "force-dynamic";

export async function GET() {
  const { user, error } = await requireAuth();
  if (error) return error;
  const rows = await prisma.entertainmentMembership.findMany({
    where: { userId: user!.id },
    orderBy: { createdAt: "desc" },
    take: 20,
  });
  return apiSuccess({ memberships: rows, status: "PRICE_PENDING", billingEnabled: false });
}

export async function POST() {
  const { user, error } = await requireAuth();
  if (error) return error;
  const existing = await prisma.entertainmentMembership.findFirst({
    where: { userId: user!.id, status: { in: ["DRAFT", "PRICE_PENDING"] } },
  });
  if (existing) return apiSuccess({ membership: existing, status: "PRICE_PENDING" });
  const membership = await prisma.entertainmentMembership.create({
    data: {
      userId: user!.id,
      sku: ENTERTAINMENT_SKU,
      status: "PRICE_PENDING",
      billingEnabled: false,
    },
  });
  return apiSuccess({ membership, status: "PRICE_PENDING", billingEnabled: false });
}
