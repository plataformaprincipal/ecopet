import { AccountStatus, PartnerServiceStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiFailure } from "@/lib/api-response";

type RouteContext = { params: Promise<{ serviceId: string }> };

export async function GET(_req: Request, context: RouteContext) {
  const { serviceId } = await context.params;

  const service = await prisma.service.findFirst({
    where: {
      id: serviceId,
      deletedAt: null,
      status: PartnerServiceStatus.ACTIVE,
      isActive: true,
      provider: { accountStatus: AccountStatus.ACTIVE, role: "PARTNER" },
    },
    include: {
      provider: {
        select: {
          id: true,
          name: true,
          partnerProfile: {
            select: {
              businessName: true,
              city: true,
              state: true,
              address: true,
              zipCode: true,
              description: true,
              category: true,
              businessHours: true,
            },
          },
        },
      },
      serviceReviews: {
        where: { moderationStatus: "VISIBLE" },
        select: { rating: true, comment: true, createdAt: true, user: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
        take: 20,
      },
    },
  });

  if (!service) return apiFailure("NOT_FOUND", "Serviço não encontrado.", 404);

  const ratings = service.serviceReviews.map((r) => r.rating);
  const avgRating = ratings.length
    ? ratings.reduce((a, b) => a + b, 0) / ratings.length
    : service.rating;

  const { serviceReviews, ...rest } = service;

  return apiSuccess({
    service: {
      ...rest,
      rating: avgRating,
      reviewCount: ratings.length || service.reviewCount,
      reviews: serviceReviews,
    },
  });
}
