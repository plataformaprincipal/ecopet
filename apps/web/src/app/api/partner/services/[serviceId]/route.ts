import { prisma } from "@/lib/prisma";
import { apiSuccess, apiFailure } from "@/lib/api-response";
import { requireActivePartner } from "@/lib/auth/require-auth";
import { partnerServiceSchema } from "@/schemas/partner-service";

type RouteContext = { params: Promise<{ serviceId: string }> };

export async function GET(_req: Request, context: RouteContext) {
  const { user, error } = await requireActivePartner();
  if (error) return error;
  const { serviceId } = await context.params;

  const service = await prisma.service.findFirst({
    where: { id: serviceId, providerId: user!.id, deletedAt: null },
  });
  if (!service) return apiFailure("NOT_FOUND", "Serviço não encontrado.", 404);
  return apiSuccess({ service });
}

export async function PUT(request: Request, context: RouteContext) {
  const { user, error } = await requireActivePartner();
  if (error) return error;
  const { serviceId } = await context.params;

  const existing = await prisma.service.findFirst({
    where: { id: serviceId, providerId: user!.id, deletedAt: null },
  });
  if (!existing) return apiFailure("NOT_FOUND", "Serviço não encontrado.", 404);

  const parsed = partnerServiceSchema.partial().safeParse(await request.json());
  if (!parsed.success) {
    return apiFailure("VALIDATION", parsed.error.errors[0]?.message ?? "Inválido", 400);
  }
  const data = parsed.data;

  const service = await prisma.service.update({
    where: { id: serviceId },
    data: {
      ...(data.name !== undefined ? { name: data.name.trim() } : {}),
      ...(data.description !== undefined ? { description: data.description.trim() } : {}),
      ...(data.category !== undefined ? { category: data.category } : {}),
      ...(data.price !== undefined ? { price: data.price } : {}),
      ...(data.durationMin !== undefined ? { durationMin: data.durationMin } : {}),
      ...(data.status !== undefined
        ? { status: data.status, isActive: data.status === "ACTIVE" }
        : {}),
      ...(data.modality !== undefined ? { modality: data.modality } : {}),
      ...(data.speciesTarget !== undefined ? { speciesTarget: data.speciesTarget } : {}),
      ...(data.notes !== undefined ? { notes: data.notes } : {}),
      ...(data.image !== undefined ? { image: data.image } : {}),
    },
  });

  return apiSuccess({ service });
}

export async function DELETE(_req: Request, context: RouteContext) {
  const { user, error } = await requireActivePartner();
  if (error) return error;
  const { serviceId } = await context.params;

  const existing = await prisma.service.findFirst({
    where: { id: serviceId, providerId: user!.id, deletedAt: null },
  });
  if (!existing) return apiFailure("NOT_FOUND", "Serviço não encontrado.", 404);

  await prisma.service.update({
    where: { id: serviceId },
    data: { deletedAt: new Date(), status: "INACTIVE", isActive: false },
  });

  return apiSuccess({ message: "Serviço removido." });
}
