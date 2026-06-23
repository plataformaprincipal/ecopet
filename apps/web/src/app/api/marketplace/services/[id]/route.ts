import { apiSuccess, apiFailure } from "@/lib/api-response";
import { AccountStatus, PartnerServiceStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: RouteContext) {
  const { id } = await params;
  const service = await prisma.service.findFirst({
    where: {
      id,
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
          partnerProfile: { select: { businessName: true, city: true, state: true } },
        },
      },
    },
  });
  if (!service) return apiFailure("NOT_FOUND", "Serviço não encontrado.", 404);
  return apiSuccess({ service });
}
