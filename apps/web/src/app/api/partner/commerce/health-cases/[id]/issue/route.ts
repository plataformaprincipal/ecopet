import { z } from "zod";
import { apiFailure, apiSuccess } from "@/lib/api-response";
import { requireAuth } from "@/lib/auth/require-auth";
import { issueProfessionalDocument } from "@/lib/commerce-catalog/health-cases";
import { CatalogCommerceError } from "@/lib/commerce-catalog/checkout";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  notes: z.string().min(8).max(8000),
  title: z.string().min(3).max(160),
});

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { user, error } = await requireAuth();
  if (error) return error;
  const { id } = await context.params;
  const parsed = bodySchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return apiFailure("VALIDATION", "Informe título e notas profissionais.", 400);
  await prisma.healthClinicalCase.updateMany({
    where: { id, professionalUserId: null },
    data: { professionalUserId: user!.id, status: "IN_PROGRESS" },
  });
  try {
    const issued = await issueProfessionalDocument({
      caseId: id,
      professionalUserId: user!.id,
      notes: parsed.data.notes,
      title: parsed.data.title,
    });
    return apiSuccess({ case: issued });
  } catch (e) {
    if (e instanceof CatalogCommerceError) return apiFailure(e.code, e.message, e.status);
    return apiFailure("ERROR", "Falha ao emitir documento.", 500);
  }
}
