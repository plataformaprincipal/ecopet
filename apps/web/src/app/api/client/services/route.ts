import { AccountStatus, PartnerServiceStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { apiSuccess } from "@/lib/api-response";
import { requireClient } from "@/lib/auth/require-auth";

export async function GET(request: Request) {
  const { error } = await requireClient();
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category") ?? undefined;
  const species = searchParams.get("species") ?? undefined;

  const services = await prisma.service.findMany({
    where: {
      deletedAt: null,
      status: PartnerServiceStatus.ACTIVE,
      isActive: true,
      ...(category ? { category: category as never } : {}),
      ...(species ? { speciesTarget: species as never } : {}),
      provider: { accountStatus: AccountStatus.ACTIVE, role: "PARTNER" },
    },
    include: {
      provider: {
        select: {
          id: true,
          name: true,
          partnerProfile: { select: { businessName: true, city: true, state: true, category: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return apiSuccess({ services, total: services.length });
}
