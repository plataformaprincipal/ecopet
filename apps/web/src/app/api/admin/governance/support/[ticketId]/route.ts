import { z } from "zod";
import { apiFailure, apiSuccess } from "@/lib/api-response";
import { requireAdmin } from "@/lib/auth/guards";
import { performSupportGovernanceAction } from "@/lib/admin/governance/support-governance-service";

const patchSchema = z.object({
  action: z.enum(["assign", "respond", "escalate", "transfer", "close", "reopen", "critical"]),
  reason: z.string().min(3).max(2000),
  assigneeId: z.string().optional(),
  response: z.string().max(8000).optional(),
  confirmed: z.boolean().optional(),
});

type RouteContext = { params: Promise<{ ticketId: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const { user, error } = await requireAdmin({ path: "/api/admin/governance/support" });
  if (error) return error;
  const { ticketId } = await context.params;
  const body = await request.json().catch(() => ({}));
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return apiFailure("VALIDATION", parsed.error.errors[0]?.message ?? "Dados inválidos", 400);
  }
  try {
    const result = await performSupportGovernanceAction({
      adminId: user!.id,
      ticketId,
      action: parsed.data.action,
      reason: parsed.data.reason,
      assigneeId: parsed.data.assigneeId,
      response: parsed.data.response,
      confirmed: parsed.data.confirmed,
    });
    return apiSuccess(result);
  } catch (e) {
    const msg = (e as Error).message;
    if (msg === "NOT_FOUND") return apiFailure("NOT_FOUND", "Ticket não encontrado.", 404);
    if (msg === "REASON_REQUIRED") return apiFailure("VALIDATION", "Motivo obrigatório.", 400);
    if (msg === "INVALID_ACTION") return apiFailure("VALIDATION", "Ação inválida.", 400);
    console.error("[governance:support:patch]", e);
    return apiFailure("INTERNAL", "Erro ao atualizar ticket.", 500);
  }
}
