import { prisma } from "@/lib/prisma";
import { apiSuccess, apiFailure } from "@/lib/api-response";
import { requireOngWithAccess } from "@/lib/ong/require-ong-access";
import { ongAdoptionListingSchema } from "@/schemas/ong-adoption-listing";
import {
  displayStatusToAdoptionStatus,
  packRequirements,
} from "@/lib/ong/adoption-listing-meta";
import { serializeOngListing } from "@/lib/ong/serialize-listing";

export async function GET() {
  const { user, error } = await requireOngWithAccess();
  if (error) return error;

  const listings = await prisma.adoptionListing.findMany({
    where: { ongId: user!.id },
    orderBy: { createdAt: "desc" },
  });

  return apiSuccess({
    listings: listings.map(serializeOngListing),
  });
}

export async function POST(request: Request) {
  const { user, error } = await requireOngWithAccess(true);
  if (error) return error;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiFailure("INVALID_BODY", "Corpo inválido.", 400);
  }

  const parsed = ongAdoptionListingSchema.safeParse(body);
  if (!parsed.success) {
    return apiFailure("VALIDATION_ERROR", parsed.error.errors[0]?.message ?? "Dados inválidos.", 400);
  }

  const data = parsed.data;
  const displayStatus = data.displayStatus ?? "disponivel";
  const { status, unavailable } = displayStatusToAdoptionStatus(displayStatus);

  const listing = await prisma.adoptionListing.create({
    data: {
      ongId: user!.id,
      name: data.name,
      species: data.species,
      breed: data.breed ?? null,
      age: data.age ?? null,
      photos: data.photos ?? [],
      description: data.description,
      requirements: packRequirements(
        {
          size: data.size ?? undefined,
          sex: data.sex ?? undefined,
          healthCondition: data.healthCondition ?? undefined,
          vaccinated: data.vaccinated,
          neutered: data.neutered,
          city: data.city ?? undefined,
          state: data.state ?? undefined,
          unavailable,
        },
        data.requirementsText
      ),
      status,
    },
  });

  return apiSuccess({ listing: serializeOngListing(listing) }, 201);
}
