import { z } from "zod";
import { apiFailure, apiSuccess } from "@/lib/api-response";
import { requireAdmin } from "@/lib/auth/guards";
import { loadGovernanceStore } from "@/lib/admin/governance/store";
import { performAccountGovernanceAction } from "@/lib/admin/governance/account-governance-service";

const postSchema = z.object({
  userId: z.string().min(1),
  type: z.enum(["leve", "media", "grave"]),
  severity: z.enum(["low", "medium", "high", "critical"]),
  reason: z.string().min(3).max(2000),
  evidence: z.string().max(5000).optional(),
  expiresAt: z.string().optional(),
});

export async function GET() {
  const { error } = await requireAdmin({ path: "/api/admin/governance/warnings" });
  if (error) return error;
  const store = await loadGovernanceStore();
  return apiSuccess({ items: store.warnings });
}

export async function POST(request: Request) {
  const { user, error } = await requireAdmin({ path: "/api/admin/governance/warnings" });
  if (error) return error;
  const body = await request.json().catch(() => ({}));
  const parsed = postSchema.safeParse(body);
  if (!parsed.success) {
    return apiFailure("VALIDATION", parsed.error.errors[0]?.message ?? "Dados inválidos", 400);
  }
  try {
    const result = await performAccountGovernanceAction({
      adminId: user!.id,
      adminName: user!.name ?? undefined,
      targetUserId: parsed.data.userId,
      action: "warn",
      reason: parsed.data.reason,
      severity: parsed.data.severity,
      warningType: parsed.data.type,
      expiresAt: parsed.data.expiresAt,
    });
    return apiSuccess(result);
  } catch (e) {
    const msg = (e as Error).message;
    if (msg === "REASON_REQUIRED") return apiFailure("VALIDATION", "Motivo obrigatório.", 400);
    return apiFailure("INTERNAL", "Erro ao emitir advertência.", 500);
  }
}
