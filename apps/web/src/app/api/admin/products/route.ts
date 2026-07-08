import { prisma } from "@/lib/prisma";
import { apiSuccess } from "@/lib/api-response";
import { requireAdmin } from "@/lib/auth/guards";

export async function GET(request: Request) {
  const { user, error } = await requireAdmin({ path: new URL(request.url).pathname });
  if (error) return error;

  const url = new URL(request.url);
  const approvalStatus = url.searchParams.get("approvalStatus");
  const page = Math.max(1, Number(url.searchParams.get("page") ?? 1));
  const pageSize = Math.min(50, Math.max(1, Number(url.searchParams.get("pageSize") ?? 20)));
  const skip = (page - 1) * pageSize;

  const where = {
    deletedAt: null,
    ...(approvalStatus ? { approvalStatus: approvalStatus as never } : {}),
  };

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: {
        seller: {
          select: {
            id: true,
            name: true,
            partnerProfile: { select: { businessName: true } },
          },
        },
      },
      orderBy: { updatedAt: "desc" },
      skip,
      take: pageSize,
    }),
    prisma.product.count({ where }),
  ]);

  return apiSuccess({
    products,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
    reviewedBy: user!.id,
  });
}
