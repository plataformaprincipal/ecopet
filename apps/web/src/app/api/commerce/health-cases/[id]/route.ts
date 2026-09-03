import { z } from "zod";
import { apiFailure, apiSuccess } from "@/lib/api-response";
import { requireAuth } from "@/lib/auth/require-auth";
import { CatalogCommerceError } from "@/lib/commerce-catalog/checkout";
import { attachAiDraft, getTutorCase, scheduleCase } from "@/lib/commerce-catalog/health-cases";

export const dynamic = "force-dynamic";

const patchSchema = z.object({
  action: z.enum(["ai-draft", "schedule"]),
  notes: z.string().max(4000).optional(),
  scheduledAt: z.string().min(10).optional(),
  professionalUserId: z.string().min(1).optional().nullable(),
});

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { user, error } = await requireAuth();
  if (error) return error;
  const { id } = await context.params;
  try {
    const row = await getTutorCase({ caseId: id, userId: user!.id });
    return apiSuccess({ case: row, disclaimer: "IA não emite laudo, diagnóstico, prescrição ou atestado definitivo." });
  } catch (e) {
    if (e instanceof CatalogCommerceError) return apiFailure(e.code, e.message, e.status);
    return apiFailure("ERROR", "Falha ao carregar o caso.", 500);
  }
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const { user, error } = await requireAuth();
  if (error) return error;
  const { id } = await context.params;
  const parsed = patchSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return apiFailure("VALIDATION", "Ação inválida.", 400);
  try {
    if (parsed.data.action === "ai-draft") {
      const row = await attachAiDraft({ caseId: id, userId: user!.id, notes: parsed.data.notes });
      return apiSuccess({ case: row });
    }
    if (!parsed.data.scheduledAt) return apiFailure("VALIDATION", "Informe data/hora do agendamento.", 400);
    const row = await scheduleCase({
      caseId: id,
      userId: user!.id,
      scheduledAt: new Date(parsed.data.scheduledAt),
      professionalUserId: parsed.data.professionalUserId,
    });
    return apiSuccess({ case: row });
  } catch (e) {
    if (e instanceof CatalogCommerceError) return apiFailure(e.code, e.message, e.status);
    return apiFailure("ERROR", "Falha ao atualizar o caso.", 500);
  }
}
