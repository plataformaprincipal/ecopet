import { apiFailure, apiSuccess } from "@/lib/api-response";
import { requireAdmin } from "@/lib/auth/guards";
import { createManualAdjustment } from "@/lib/finance/manual-adjustment";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const { user, error } = await requireAdmin({ path: "/api/admin/financeiro/adjustments" });
  if (error) return error;

  const body = await req.json().catch(() => ({}));
  if (!body.idempotencyKey || typeof body.idempotencyKey !== "string") {
    return apiFailure("VALIDATION", "idempotencyKey obrigatório", 400);
  }
  const r = await createManualAdjustment({
    partnerId: body.partnerId ?? null,
    amountCents: Number(body.amountCents),
    direction: body.direction === "DEBIT" ? "DEBIT" : "CREDIT",
    reason: String(body.reason || ""),
    evidence: body.evidence,
    actorId: user!.id,
    approverId: body.approverId,
    idempotencyKey: body.idempotencyKey,
  });

  if (!r.ok) return apiFailure(r.code, r.code, 400);
  return apiSuccess(r);
}
