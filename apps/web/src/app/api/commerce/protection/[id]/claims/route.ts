import { z } from "zod";
import { apiFailure, apiSuccess } from "@/lib/api-response";
import { requireAuth } from "@/lib/auth/require-auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  description: z.string().min(8).max(4000),
});

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { user, error } = await requireAuth();
  if (error) return error;
  const { id } = await context.params;
  const parsed = bodySchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return apiFailure("VALIDATION", "Descreva o sinistro.", 400);
  const enrollment = await prisma.protectionEnrollment.findFirst({
    where: { id, userId: user!.id },
  });
  if (!enrollment) return apiFailure("NOT_FOUND", "Adesão não encontrada.", 404);
  if (enrollment.status !== "ACTIVE") {
    return apiFailure("PARTNER_REQUIRED", "Sinistro só após cobertura ativa com operador autorizado.", 409);
  }
  const claim = await prisma.protectionClaim.create({
    data: { enrollmentId: enrollment.id, description: parsed.data.description, status: "OPEN" },
  });
  return apiSuccess({ claim });
}
