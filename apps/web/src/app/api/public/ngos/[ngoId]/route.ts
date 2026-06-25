import { prisma } from "@/lib/prisma";
import { apiSuccess, apiFailure } from "@/lib/api-response";
import { serializeOngListing } from "@/lib/ong/serialize-listing";
import { serializeCampaign } from "@/lib/ong/serialize-campaign";
import { unpackRequirements } from "@/lib/ong/adoption-listing-meta";

type RouteContext = { params: Promise<{ ngoId: string }> };

/** Perfil público de uma ONG aprovada + seus animais disponíveis e campanhas ativas. */
export async function GET(_request: Request, context: RouteContext) {
  const { ngoId } = await context.params;

  const ngo = await prisma.user.findFirst({
    where: {
      id: ngoId,
      role: "ONG",
      accountStatus: "ACTIVE",
      ongProfile: { is: { verificationStatus: "APPROVED" } },
    },
    select: {
      id: true,
      name: true,
      ongProfile: {
        select: {
          ongName: true,
          name: true,
          city: true,
          state: true,
          description: true,
          focusArea: true,
          responsible: true,
          institutionalEmail: true,
          photos: true,
          requirements: true,
        },
      },
    },
  });

  if (!ngo) {
    return apiFailure("NOT_FOUND", "ONG não encontrada.", 404);
  }

  const [listings, campaigns] = await Promise.all([
    prisma.adoptionListing.findMany({
      where: { ongId: ngoId, status: "AVAILABLE" },
      orderBy: { createdAt: "desc" },
      take: 30,
    }),
    prisma.campaign.findMany({
      where: { ongId: ngoId, status: "ACTIVE" },
      orderBy: { createdAt: "desc" },
      take: 30,
    }),
  ]);

  const animals = listings
    .filter((l) => !unpackRequirements(l.requirements).meta.unavailable)
    .map(serializeOngListing);

  return apiSuccess({
    ngo: {
      id: ngo.id,
      name: ngo.ongProfile?.ongName ?? ngo.ongProfile?.name ?? ngo.name,
      city: ngo.ongProfile?.city ?? null,
      state: ngo.ongProfile?.state ?? null,
      description: ngo.ongProfile?.description ?? null,
      focusArea: ngo.ongProfile?.focusArea ?? null,
      responsible: ngo.ongProfile?.responsible ?? null,
    },
    animals,
    campaigns: campaigns.map(serializeCampaign),
  });
}
