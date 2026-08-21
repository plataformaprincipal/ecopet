import { apiFailure, apiSuccess } from "@/lib/api-response";
import { requireAuth } from "@/lib/auth/require-auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const { user, error } = await requireAuth();
  if (error) return error;
  const pets = await prisma.pet.findMany({
    where: { ownerId: user!.id, deletedAt: null },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      species: true,
      breed: true,
      birthDate: true,
      photo: true,
      weight: true,
    },
  });
  return apiSuccess({ pets });
}
