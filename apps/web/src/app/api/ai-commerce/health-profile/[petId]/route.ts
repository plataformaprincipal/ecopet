import { apiSuccess } from "@/lib/api-response";
import { requireAuth } from "@/lib/auth/require-auth";
import { prisma } from "@/lib/prisma";
import { assertPetOwned } from "@/lib/ai-commerce/entitlement-service";
import { getProductDefBySku } from "@/lib/ai-commerce/catalog";
import { handleAiCommerceError } from "@/lib/ai-commerce/http";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ petId: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  const { user, error } = await requireAuth();
  if (error) return error;
  const { petId } = await ctx.params;
  try {
    await assertPetOwned(user!.id, petId);
    const [pet, weights, vaccines, meds, exams, executions, profile] = await Promise.all([
      prisma.pet.findFirst({
        where: { id: petId, ownerId: user!.id, deletedAt: null },
        select: { name: true, breed: true, species: true, weight: true, birthDate: true, photo: true },
      }),
      prisma.petWeightRecord.findMany({ where: { petId }, orderBy: { recordedAt: "desc" }, take: 20 }).catch(() => []),
      prisma.vaccination.findMany({ where: { petId }, orderBy: { date: "desc" }, take: 20 }).catch(() => []),
      prisma.medication.findMany({ where: { petId }, take: 20 }).catch(() => []),
      prisma.exam.findMany({ where: { petId }, orderBy: { date: "desc" }, take: 20 }).catch(() => []),
      prisma.aIExecution.findMany({
        where: { userId: user!.id, petId, status: "COMPLETED" },
        orderBy: { completedAt: "desc" },
        take: 30,
        include: { entitlement: { select: { sku: true } } },
      }),
      prisma.petHealthProfile.findUnique({ where: { petId } }).catch(() => null),
    ]);
    const last = (cap: string) =>
      executions.find((e) => e.capabilityId.includes(cap) || getProductDefBySku(e.entitlement.sku)?.workspaceKind === cap);
    return apiSuccess({
      pet,
      activated: Boolean(profile),
      cards: {
        weight: pet?.weight ?? weights[0]?.weight ?? null,
        vaccines: vaccines.length,
        medications: meds.length,
        exams: exams.length,
        lastVet: last("assessment")?.completedAt ?? null,
        lastCheckup: last("checkup")?.completedAt ?? null,
      },
      weights,
      vaccines,
      medications: meds,
      exams,
      ia: executions.map((e) => ({
        id: e.id,
        name: getProductDefBySku(e.entitlement.sku)?.name ?? e.entitlement.sku,
        date: e.completedAt,
        href: getProductDefBySku(e.entitlement.sku)?.workspaceHref(e.id),
      })),
    });
  } catch (e) {
    return handleAiCommerceError(e);
  }
}
