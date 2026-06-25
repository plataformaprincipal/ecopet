import { prisma } from "@/lib/prisma";
import { apiSuccess } from "@/lib/api-response";
import { serializeOngListing } from "@/lib/ong/serialize-listing";
import { unpackRequirements } from "@/lib/ong/adoption-listing-meta";

/** Animais disponíveis publicamente para adoção (somente ONGs aprovadas). */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const species = url.searchParams.get("species")?.trim();
  const q = url.searchParams.get("q")?.trim();

  const listings = await prisma.adoptionListing.findMany({
    where: {
      status: "AVAILABLE",
      ...(species ? { species: species as never } : {}),
      ...(q ? { name: { contains: q, mode: "insensitive" as const } } : {}),
      ong: {
        accountStatus: "ACTIVE",
        ongProfile: { is: { verificationStatus: "APPROVED" } },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 60,
    include: {
      ong: {
        select: { id: true, name: true, ongProfile: { select: { ongName: true, name: true, city: true, state: true } } },
      },
    },
  });

  const animals = listings
    .filter((l) => {
      const { meta } = unpackRequirements(l.requirements);
      return !meta.unavailable;
    })
    .map((l) => ({
      ...serializeOngListing(l),
      ong: {
        id: l.ong.id,
        name: l.ong.ongProfile?.ongName ?? l.ong.ongProfile?.name ?? l.ong.name,
        city: l.ong.ongProfile?.city ?? null,
        state: l.ong.ongProfile?.state ?? null,
      },
    }));

  return apiSuccess({ animals, total: animals.length });
}
