import { z } from "zod";
import { apiSuccess, apiFailure } from "@/lib/api-response";
import { requireAdmin } from "@/lib/admin/require-admin";
import { reviewAccount } from "@/lib/admin/accounts-service";

const reviewSchema = z.object({
  action: z.enum(["approve", "reject", "suspend"]),
  reason: z.string().max(1000).optional(),
});

type RouteContext = { params: Promise<{ userId: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const { user, error } = await requireAdmin();
  if (error) return error;

  const { userId } = await context.params;
  const body = await request.json();
  const parsed = reviewSchema.safeParse(body);

  if (!parsed.success) {
    const first = parsed.error.errors[0];
    return apiFailure("VALIDATION", first?.message ?? "Dados inválidos", 400);
  }

  try {
    const result = await reviewAccount({
      targetUserId: userId,
      action: parsed.data.action,
      reason: parsed.data.reason,
      adminId: user!.id,
    });

    return apiSuccess({
      message:
        parsed.data.action === "approve"
          ? "Conta aprovada com sucesso."
          : parsed.data.action === "reject"
            ? "Conta rejeitada."
            : "Conta suspensa.",
      accountStatus: result.accountStatus,
      userId,
    });
  } catch (e) {
    const code = (e as Error).message;
    if (code === "NOT_FOUND") {
      return apiFailure("NOT_FOUND", "Conta não encontrada.", 404);
    }
    if (code === "INVALID_ROLE") {
      return apiFailure("FORBIDDEN", "Somente contas de parceiro ou ONG podem ser revisadas.", 403);
    }
    if (code === "REASON_REQUIRED") {
      return apiFailure("VALIDATION", "Informe o motivo da rejeição.", 400);
    }
    if (code === "SELF_ACTION") {
      return apiFailure("FORBIDDEN", "Você não pode executar esta ação em sua própria conta.", 403);
    }
    if (process.env.NODE_ENV !== "production") {
      console.error("[admin:accounts:review]", e);
    }
    return apiFailure("UNEXPECTED", "Não foi possível processar a solicitação.", 500);
  }
}
