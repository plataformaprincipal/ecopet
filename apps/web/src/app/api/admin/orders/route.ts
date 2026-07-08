import { prisma } from "@/lib/prisma";
import { apiSuccess } from "@/lib/api-response";
import { requireAdmin } from "@/lib/auth/guards";

export async function GET(request: Request) {
  const { user, error } = await requireAdmin({ path: new URL(request.url).pathname });
  if (error) return error;

  const url = new URL(request.url);
  const page = Math.max(1, Number(url.searchParams.get("page") ?? 1));
  const pageSize = Math.min(50, Math.max(1, Number(url.searchParams.get("pageSize") ?? 20)));
  const skip = (page - 1) * pageSize;

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      include: {
        items: true,
        user: { select: { id: true, name: true, email: true } },
        partner: { select: { id: true, name: true, partnerProfile: { select: { businessName: true } } } },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
    }),
    prisma.order.count(),
  ]);

  return apiSuccess({ orders, total, page, pageSize, totalPages: Math.ceil(total / pageSize), reviewedBy: user!.id });
}
