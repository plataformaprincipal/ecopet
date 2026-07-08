import { prisma } from "@/lib/prisma";
import { apiSuccess } from "@/lib/api-response";
import { requireClient } from "@/lib/auth/require-auth";

export async function GET() {
  const { user, error } = await requireClient();
  if (error) return error;

  const pets = await prisma.pet.findMany({
    where: { ownerId: user!.id, deletedAt: null },
    select: { id: true },
  });
  const petIds = pets.map((p) => p.id);

  if (petIds.length === 0) {
    return apiSuccess({ documents: [], total: 0 });
  }

  const documents = await prisma.petDocument.findMany({
    where: { petId: { in: petIds }, deletedAt: null },
    include: { pet: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return apiSuccess({
    documents: documents.map((d) => ({
      id: d.id,
      name: d.name,
      type: d.type,
      description: d.description ?? null,
      petName: d.pet.name,
      documentDate: d.documentDate ? d.documentDate.toISOString() : null,
      url: d.url ?? null,
      createdAt: d.createdAt.toISOString(),
    })),
    total: documents.length,
  });
}
