import { prisma } from "@/lib/prisma";
import { apiSuccess } from "@/lib/api-response";
import { requireAuth } from "@/lib/auth/require-auth";
import { UserRole } from "@prisma/client";

export async function GET(request: Request) {
  const { user, error } = await requireAuth([UserRole.ADMIN]);
  if (error) return error;

  const url = new URL(request.url);
  const moderationStatus = url.searchParams.get("moderationStatus");
  const page = Math.max(1, Number(url.searchParams.get("page") ?? 1));
  const pageSize = Math.min(50, Math.max(1, Number(url.searchParams.get("pageSize") ?? 20)));
  const skip = (page - 1) * pageSize;

  const where = moderationStatus ? { moderationStatus: moderationStatus as never } : {};

  const [reviews, total] = await Promise.all([
    prisma.serviceReview.findMany({
      where,
      include: {
        service: { select: { id: true, name: true } },
        user: { select: { id: true, name: true } },
        appointment: { select: { id: true, scheduledAt: true } },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
    }),
    prisma.serviceReview.count({ where }),
  ]);

  return apiSuccess({ reviews, total, page, pageSize, totalPages: Math.ceil(total / pageSize), reviewedBy: user!.id });
}
