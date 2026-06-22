import { prisma } from "@/lib/prisma";
import { apiSuccess, apiFailure } from "@/lib/api-response";
import { requireOngWithAccess } from "@/lib/ong/require-ong-access";
import { ongAdoptionListingUpdateSchema } from "@/schemas/ong-adoption-listing";
import {
  displayStatusToAdoptionStatus,
  packRequirements,
  unpackRequirements,
} from "@/lib/ong/adoption-listing-meta";
import { serializeOngListing } from "@/lib/ong/serialize-listing";

type RouteContext = { params: Promise<{ listingId: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const { user, error } = await requireOngWithAccess();
  if (error) return error;

  const { listingId } = await context.params;
  const listing = await prisma.adoptionListing.findFirst({
    where: { id: listingId, ongId: user!.id },
  });

  if (!listing) {
    return apiFailure("NOT_FOUND", "Animal não encontrado.", 404);
  }

  return apiSuccess({ listing: serializeOngListing(listing) });
}

export async function PUT(request: Request, context: RouteContext) {
  const { user, error } = await requireOngWithAccess(true);
  if (error) return error;

  const { listingId } = await context.params;
  const existing = await prisma.adoptionListing.findFirst({
    where: { id: listingId, ongId: user!.id },
  });

  if (!existing) {
    return apiFailure("NOT_FOUND", "Animal não encontrado.", 404);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiFailure("INVALID_BODY", "Corpo inválido.", 400);
  }

  const parsed = ongAdoptionListingUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return apiFailure("VALIDATION_ERROR", parsed.error.errors[0]?.message ?? "Dados inválidos.", 400);
  }

  const data = parsed.data;
  const { meta: existingMeta, text: existingText } = unpackRequirements(existing.requirements);

  const mergedMeta = {
    size: data.size ?? existingMeta.size,
    sex: data.sex ?? existingMeta.sex,
    healthCondition: data.healthCondition ?? existingMeta.healthCondition,
    vaccinated: data.vaccinated ?? existingMeta.vaccinated,
    neutered: data.neutered ?? existingMeta.neutered,
    city: data.city ?? existingMeta.city,
    state: data.state ?? existingMeta.state,
    unavailable: existingMeta.unavailable,
  };

  let status = existing.status;
  if (data.displayStatus) {
    const mapped = displayStatusToAdoptionStatus(data.displayStatus);
    status = mapped.status;
    mergedMeta.unavailable = mapped.unavailable;
  }

  const listing = await prisma.adoptionListing.update({
    where: { id: listingId },
    data: {
      name: data.name ?? existing.name,
      species: data.species ?? existing.species,
      breed: data.breed !== undefined ? data.breed : existing.breed,
      age: data.age !== undefined ? data.age : existing.age,
      photos:
        data.photos !== undefined
          ? (data.photos as string[])
          : existing.photos === null
            ? undefined
            : (existing.photos as string[]),
      description: data.description ?? existing.description,
      requirements: packRequirements(
        mergedMeta,
        data.requirementsText !== undefined ? data.requirementsText : existingText
      ),
      status,
    },
  });

  return apiSuccess({ listing: serializeOngListing(listing) });
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { user, error } = await requireOngWithAccess(true);
  if (error) return error;

  const { listingId } = await context.params;
  const existing = await prisma.adoptionListing.findFirst({
    where: { id: listingId, ongId: user!.id },
  });

  if (!existing) {
    return apiFailure("NOT_FOUND", "Animal não encontrado.", 404);
  }

  await prisma.adoptionListing.delete({ where: { id: listingId } });

  return apiSuccess({ deleted: true });
}
