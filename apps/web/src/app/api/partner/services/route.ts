import { prisma } from "@/lib/prisma";
import { apiSuccess, apiFailure } from "@/lib/api-response";
import { requireActivePartner } from "@/lib/auth/require-auth";
import { partnerServiceSchema } from "@/schemas/partner-service";
import { PartnerServiceStatus } from "@prisma/client";

export async function GET() {
  const { user, error } = await requireActivePartner();
  if (error) return error;

  const services = await prisma.service.findMany({
    where: { providerId: user!.id, deletedAt: null },
    orderBy: { createdAt: "desc" },
  });

  return apiSuccess({ services, total: services.length });
}

export async function POST(request: Request) {
  const { user, error } = await requireActivePartner();
  if (error) return error;

  const parsed = partnerServiceSchema.safeParse(await request.json());
  if (!parsed.success) {
    return apiFailure("VALIDATION", parsed.error.errors[0]?.message ?? "Inválido", 400);
  }

  const data = parsed.data;
  const service = await prisma.service.create({
    data: {
      providerId: user!.id,
      name: data.name.trim(),
      description: data.description.trim(),
      category: data.category,
      price: data.price,
      durationMin: data.durationMin ?? 60,
      status: data.status ?? PartnerServiceStatus.DRAFT,
      modality: data.modality ?? null,
      speciesTarget: data.speciesTarget ?? null,
      notes: data.notes ?? null,
      image: data.image ?? null,
      isActive: data.status === PartnerServiceStatus.ACTIVE,
    },
  });

  return apiSuccess({ service }, 201);
}
