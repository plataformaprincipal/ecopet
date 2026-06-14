import { prisma } from "@/lib/prisma";
import { apiSuccess, apiFailure } from "@/lib/api-response";
import { requireClient } from "@/lib/auth/require-auth";
import { assertPetOwnership, petListSelect } from "@/lib/client/pet-ownership";
import { petUpdateSchema } from "@/schemas/client-pet";

type RouteContext = { params: Promise<{ petId: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const { user, error } = await requireClient();
  if (error) return error;

  const { petId } = await context.params;
  const pet = await assertPetOwnership(petId, user!.id);
  if (!pet) return apiFailure("NOT_FOUND", "Pet não encontrado.", 404);

  const full = await prisma.pet.findUnique({
    where: { id: petId },
    select: {
      ...petListSelect,
      vaccinations: { orderBy: { date: "desc" } },
      allergies: true,
      medications: true,
      medicalRecords: { orderBy: { recordDate: "desc" } },
      reminders: { where: { status: "PENDING" }, orderBy: { dueAt: "asc" } },
      petDocuments: { orderBy: { createdAt: "desc" } },
    },
  });

  return apiSuccess({ pet: full });
}

export async function PUT(request: Request, context: RouteContext) {
  const { user, error } = await requireClient();
  if (error) return error;

  const { petId } = await context.params;
  const owned = await assertPetOwnership(petId, user!.id);
  if (!owned) return apiFailure("NOT_FOUND", "Pet não encontrado.", 404);

  const parsed = petUpdateSchema.safeParse(await request.json());
  if (!parsed.success) {
    const first = parsed.error.errors[0];
    return apiFailure("VALIDATION", first?.message ?? "Dados inválidos", 400);
  }

  const data = parsed.data;
  const pet = await prisma.pet.update({
    where: { id: petId },
    data: {
      ...(data.name !== undefined ? { name: data.name.trim() } : {}),
      ...(data.species !== undefined ? { species: data.species } : {}),
      ...(data.breed !== undefined ? { breed: data.breed } : {}),
      ...(data.sex !== undefined ? { sex: data.sex } : {}),
      ...(data.birthDate !== undefined
        ? { birthDate: data.birthDate ? new Date(data.birthDate) : null }
        : {}),
      ...(data.weight !== undefined ? { weight: data.weight } : {}),
      ...(data.color !== undefined ? { color: data.color } : {}),
      ...(data.microchip !== undefined
        ? { microchip: data.microchip, hasMicrochip: Boolean(data.microchip) }
        : {}),
      ...(data.neutered !== undefined ? { neutered: data.neutered } : {}),
      ...(data.notes !== undefined ? { notes: data.notes } : {}),
      ...(data.photo !== undefined ? { photo: data.photo } : {}),
    },
    select: petListSelect,
  });

  return apiSuccess({ pet, message: "Pet atualizado." });
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { user, error } = await requireClient();
  if (error) return error;

  const { petId } = await context.params;
  const owned = await assertPetOwnership(petId, user!.id);
  if (!owned) return apiFailure("NOT_FOUND", "Pet não encontrado.", 404);

  await prisma.pet.update({
    where: { id: petId },
    data: { deletedAt: new Date() },
  });

  return apiSuccess({ message: "Pet removido." });
}
