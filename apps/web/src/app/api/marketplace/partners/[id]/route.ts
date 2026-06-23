import { apiSuccess, apiFailure } from "@/lib/api-response";
import { getPublicPartner } from "@/lib/marketplace/public-query";
import { prisma } from "@/lib/prisma";
import { AccountStatus } from "@prisma/client";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: RouteContext) {
  const { id } = await params;

  let partnerId = id;
  const bySlug = await prisma.partnerProfile.findFirst({
    where: { businessName: { equals: id, mode: "insensitive" } },
    select: { userId: true },
  }).catch(() => null);
  if (bySlug) partnerId = bySlug.userId;

  const partner = await prisma.user.findFirst({
    where: { id: partnerId, role: "PARTNER", accountStatus: AccountStatus.ACTIVE },
    select: { id: true },
  });
  if (!partner) return apiFailure("NOT_FOUND", "Parceiro não encontrado.", 404);

  const data = await getPublicPartner(partnerId);
  if (!data) return apiFailure("NOT_FOUND", "Parceiro não encontrado.", 404);

  const profile = await prisma.partnerProfile.findUnique({
    where: { userId: partnerId },
    select: { businessHours: true, logoAlt: true },
  });

  return apiSuccess({
    partner: {
      ...data,
      slug: partnerId,
      businessHours: profile?.businessHours,
    },
  });
}
