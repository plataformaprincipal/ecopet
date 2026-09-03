import { apiSuccess } from "@/lib/api-response";
import { requireAuth } from "@/lib/auth/require-auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const { user, error } = await requireAuth();
  if (error) return error;
  const vet = await prisma.veterinarianProfile.findUnique({
    where: { userId: user!.id },
    select: { crmv: true },
  });
  const cases = await prisma.healthClinicalCase.findMany({
    where: vet?.crmv
      ? { OR: [{ professionalUserId: user!.id }, { professionalUserId: null }] }
      : { professionalUserId: user!.id },
    include: { documents: true, pet: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
    take: 80,
  });
  return apiSuccess({
    cases,
    hasCrmv: Boolean(vet?.crmv),
    disclaimer: "Documento final exige CRMV. IA gera apenas rascunho assistivo.",
  });
}
