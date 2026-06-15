import { z } from "zod";
import { apiSuccess, apiFailure } from "@/lib/api-response";
import { requireGestorAdmin } from "@/lib/gestor/gestor-permissions";
import { updateGestorUserStatus } from "@/lib/gestor/gestor-users-service";

const actionSchema = z.object({
  action: z.enum(["suspend", "reactivate"]),
  reason: z.string().max(500).optional(),
});

type RouteContext = { params: Promise<{ userId: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const { user, error } = await requireGestorAdmin();
  if (error) return error;

  const { userId } = await context.params;
  const body = await request.json().catch(() => ({}));
  const parsed = actionSchema.safeParse(body);
  if (!parsed.success) {
    return apiFailure("VALIDATION", parsed.error.errors[0]?.message ?? "Dados inválidos", 400);
  }

  try {
    const result = await updateGestorUserStatus({
      userId,
      action: parsed.data.action,
      reason: parsed.data.reason,
      adminId: user!.id,
    });
    return apiSuccess(result);
  } catch (e) {
    if ((e as Error).message === "NOT_FOUND") {
      return apiFailure("NOT_FOUND", "Usuário não encontrado.", 404);
    }
    console.error("[gestor:users:patch]", e);
    return apiFailure("INTERNAL", "Erro interno. Tente novamente.", 500);
  }
}
