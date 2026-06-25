import { prisma } from "@/lib/prisma";
import { apiSuccess, apiFailure } from "@/lib/api-response";
import { serializeOngListing } from "@/lib/ong/serialize-listing";

type RouteContext = { params: Promise<{ listingId: string }> };

/** Detalhe público de um animal para adoção. */
export async function GET(_request: Request, context: RouteContext) {
  const { listingId } = await context.params;

  const listing = await prisma.adoptionListing.findFirst({
    where: {
      id: listingId,
      ong: {
        accountStatus: "ACTIVE",
        ongProfile: { is: { verificationStatus: "APPROVED" } },
      },
    },
    include: {
      ong: {
        select: {
          id: true,
          name: true,
          ongProfile: {
            select: { ongName: true, name: true, city: true, state: true, description: true },
          },
        },
      },
    },
  });

  if (!listing) {
    return apiFailure("NOT_FOUND", "Animal não encontrado.", 404);
  }

  return apiSuccess({
    animal: {
      ...serializeOngListing(listing),
      ong: {
        id: listing.ong.id,
        name: listing.ong.ongProfile?.ongName ?? listing.ong.ongProfile?.name ?? listing.ong.name,
        city: listing.ong.ongProfile?.city ?? null,
        state: listing.ong.ongProfile?.state ?? null,
        description: listing.ong.ongProfile?.description ?? null,
      },
    },
  });
}
