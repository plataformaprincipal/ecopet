import { AccountStatus, PartnerServiceStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiFailure } from "@/lib/api-response";
import { requireClient } from "@/lib/auth/require-auth";

type RouteContext = { params: Promise<{ serviceId: string }> };

export async function GET(_req: Request, context: RouteContext) {
  const { error } = await requireClient();
  if (error) return error;
  const { serviceId } = await context.params;

  const service = await prisma.service.findFirst({
    where: {
      id: serviceId,
      deletedAt: null,
      status: PartnerServiceStatus.ACTIVE,
      provider: { accountStatus: AccountStatus.ACTIVE, role: "PARTNER" },
    },
    include: {
      provider: {
        select: {
          id: true,
          name: true,
          partnerProfile: {
            select: { businessName: true, city: true, state: true, category: true, address: true },
          },
        },
      },
    },
  });

  if (!service) return apiFailure("NOT_FOUND", "Serviço não encontrado.", 404);
  return apiSuccess({ service });
}
