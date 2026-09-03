import { z } from "zod";
import { apiFailure, apiSuccess } from "@/lib/api-response";
import { requireAuth } from "@/lib/auth/require-auth";
import { prisma } from "@/lib/prisma";
import { createHealthCase } from "@/lib/commerce-catalog/health-cases";
import { CatalogCommerceError } from "@/lib/commerce-catalog/checkout";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  sku: z.string().min(3),
  petId: z.string().min(1),
  intake: z.record(z.string(), z.unknown()).optional(),
});

export async function GET() {
  const { user, error } = await requireAuth();
  if (error) return error;
  const cases = await prisma.healthClinicalCase.findMany({
    where: { userId: user!.id },
    include: { documents: true, pet: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return apiSuccess({ cases });
}

export async function POST(request: Request) {
  const { user, error } = await requireAuth();
  if (error) return error;
  const parsed = bodySchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return apiFailure("VALIDATION", "Informe SKU e pet.", 400);
  try {
    const row = await createHealthCase({
      userId: user!.id,
      petId: parsed.data.petId,
      sku: parsed.data.sku,
      intake: parsed.data.intake,
    });
    return apiSuccess({ case: row });
  } catch (e) {
    if (e instanceof CatalogCommerceError) return apiFailure(e.code, e.message, e.status);
    return apiFailure("ERROR", "Falha ao abrir caso.", 500);
  }
}
