import { prisma } from "@/lib/prisma";
import { apiSuccess, apiFailure } from "@/lib/api-response";
import { requireClient } from "@/lib/auth/require-auth";
import { assertPetOwnership } from "@/lib/client/pet-ownership";
import {
  vaccinationSchema,
  allergySchema,
  healthRecordSchema,
  reminderSchema,
  petDocumentSchema,
} from "@/schemas/client-pet";

type RouteContext = { params: Promise<{ petId: string }> };

export async function POST(request: Request, context: RouteContext) {
  const { user, error } = await requireClient();
  if (error) return error;

  const { petId } = await context.params;
  const owned = await assertPetOwnership(petId, user!.id);
  if (!owned) return apiFailure("NOT_FOUND", "Pet não encontrado.", 404);

  const body = await request.json();
  const resource = body.resource as string;

  if (resource === "vaccination") {
    const parsed = vaccinationSchema.safeParse(body.data);
    if (!parsed.success) return apiFailure("VALIDATION", parsed.error.errors[0]?.message ?? "Inválido", 400);
    const d = parsed.data;
    const item = await prisma.vaccination.create({
      data: {
        petId,
        name: d.name,
        date: new Date(d.appliedAt),
        nextDue: d.nextDueAt ? new Date(d.nextDueAt) : null,
        veterinarian: d.veterinarianName ?? null,
        batch: d.batchNumber ?? null,
        notes: d.notes ?? null,
      },
    });
    return apiSuccess({ item }, 201);
  }

  if (resource === "allergy") {
    const parsed = allergySchema.safeParse(body.data);
    if (!parsed.success) return apiFailure("VALIDATION", parsed.error.errors[0]?.message ?? "Inválido", 400);
    const d = parsed.data;
    const item = await prisma.allergy.create({
      data: { petId, allergen: d.name, severity: d.severity ?? null, notes: d.notes ?? null },
    });
    return apiSuccess({ item }, 201);
  }

  if (resource === "health") {
    const parsed = healthRecordSchema.safeParse(body.data);
    if (!parsed.success) return apiFailure("VALIDATION", parsed.error.errors[0]?.message ?? "Inválido", 400);
    const d = parsed.data;
    const item = await prisma.medicalRecord.create({
      data: {
        petId,
        authorId: user!.id,
        type: d.type,
        title: d.title,
        content: d.description ?? null,
        recordDate: new Date(d.eventDate),
        veterinarianName: d.veterinarianName ?? null,
        clinicName: d.clinicName ?? null,
      },
    });
    return apiSuccess({ item }, 201);
  }

  if (resource === "reminder") {
    const parsed = reminderSchema.safeParse(body.data);
    if (!parsed.success) return apiFailure("VALIDATION", parsed.error.errors[0]?.message ?? "Inválido", 400);
    const d = parsed.data;
    const item = await prisma.petReminder.create({
      data: {
        petId,
        type: d.type,
        title: d.title,
        description: d.description ?? null,
        dueAt: new Date(d.dueAt),
      },
    });
    return apiSuccess({ item }, 201);
  }

  if (resource === "document") {
    const parsed = petDocumentSchema.safeParse(body.data);
    if (!parsed.success) return apiFailure("VALIDATION", parsed.error.errors[0]?.message ?? "Inválido", 400);
    const d = parsed.data;
    const item = await prisma.petDocument.create({
      data: {
        petId,
        ownerId: user!.id,
        type: d.type,
        name: d.name,
        description: d.description ?? null,
        documentDate: d.documentDate ? new Date(d.documentDate) : null,
        url: d.url ?? null,
        mimeType: d.mimeType ?? null,
        sizeBytes: d.sizeBytes ?? null,
      },
    });
    return apiSuccess({ item }, 201);
  }

  return apiFailure("VALIDATION", "Recurso não suportado.", 400);
}
