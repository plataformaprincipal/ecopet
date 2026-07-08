import { z } from "zod";
import { apiFailure, apiSuccess } from "@/lib/api-response";
import { requireAdmin } from "@/lib/auth/guards";
import { reviewWarning } from "@/lib/admin/governance/support-governance-service";

const patchSchema = z.object({
  decision: z.enum(["revogada", "mantida"]),
  reason: z.string().min(3).max(2000),
});

type RouteContext = { params: Promise<{ warningId: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const { user, error } = await requireAdmin({ path: "/api/admin/governance/warnings" });
  if (error) return error;
  const { warningId } = await context.params;
  const body = await request.json().catch(() => ({}));
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return apiFailure("VALIDATION", parsed.error.errors[0]?.message ?? "Dados inválidos", 400);
  }
  try {
    const result = await reviewWarning({
      adminId: user!.id,
      warningId,
      decision: parsed.data.decision,
      reason: parsed.data.reason,
    });
    return apiSuccess(result);
  } catch (e) {
    if ((e as Error).message === "NOT_FOUND") return apiFailure("NOT_FOUND", "Advertência não encontrada.", 404);
    return apiFailure("INTERNAL", "Erro ao revisar advertência.", 500);
  }
}
