import { z } from "zod";
import { apiFailure, apiSuccess } from "@/lib/api-response";
import { requireAdmin } from "@/lib/auth/guards";
import {
  getAccountGovernanceDetail,
  performAccountGovernanceAction,
  type AccountGovernanceAction,
} from "@/lib/admin/governance/account-governance-service";
import { AccountStatus, UserRole } from "@prisma/client";

const patchSchema = z.object({
  action: z.enum([
    "warn",
    "suspend",
    "reactivate",
    "temp_block",
    "permanent_block",
    "deactivate",
    "anonymize",
    "force_logout",
    "change_role",
    "change_status",
    "approve",
    "reject",
  ]),
  reason: z.string().min(3).max(2000),
  severity: z.enum(["low", "medium", "high", "critical"]).optional(),
  warningType: z.enum(["leve", "media", "grave"]).optional(),
  expiresAt: z.string().optional(),
  newRole: z.nativeEnum(UserRole).optional(),
  newStatus: z.nativeEnum(AccountStatus).optional(),
  confirmed: z.boolean().optional(),
});

type RouteContext = { params: Promise<{ userId: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const { error } = await requireAdmin({ path: "/api/admin/governance/accounts" });
  if (error) return error;
  const { userId } = await context.params;
  const detail = await getAccountGovernanceDetail(userId);
  if (!detail) return apiFailure("NOT_FOUND", "Usuário não encontrado.", 404);
  return apiSuccess(detail);
}

export async function PATCH(request: Request, context: RouteContext) {
  const { user, error } = await requireAdmin({ path: "/api/admin/governance/accounts" });
  if (error) return error;
  const { userId } = await context.params;
  const body = await request.json().catch(() => ({}));
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return apiFailure("VALIDATION", parsed.error.errors[0]?.message ?? "Dados inválidos", 400);
  }
  try {
    const result = await performAccountGovernanceAction({
      adminId: user!.id,
      adminName: user!.name ?? undefined,
      targetUserId: userId,
      action: parsed.data.action as AccountGovernanceAction,
      reason: parsed.data.reason,
      severity: parsed.data.severity,
      warningType: parsed.data.warningType,
      expiresAt: parsed.data.expiresAt,
      newRole: parsed.data.newRole,
      newStatus: parsed.data.newStatus,
      confirmed: parsed.data.confirmed,
    });
    return apiSuccess(result);
  } catch (e) {
    const msg = (e as Error).message;
    if (msg === "NOT_FOUND") return apiFailure("NOT_FOUND", "Usuário não encontrado.", 404);
    if (msg === "REASON_REQUIRED") return apiFailure("VALIDATION", "Motivo obrigatório.", 400);
    if (msg === "CONFIRMATION_REQUIRED") return apiFailure("VALIDATION", "Confirmação obrigatória.", 400);
    if (msg === "SELF_ACTION") return apiFailure("FORBIDDEN", "Ação não permitida na própria conta.", 403);
    if (msg === "INVALID_ROLE_FOR_REVIEW") return apiFailure("VALIDATION", "Aprovação/rejeição só para parceiro/ONG.", 400);
    console.error("[governance:accounts:patch]", e);
    return apiFailure("INTERNAL", "Erro interno.", 500);
  }
}
