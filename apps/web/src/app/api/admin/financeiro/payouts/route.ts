import { apiFailure, apiSuccess } from "@/lib/api-response";
import { requireAdmin } from "@/lib/auth/guards";
import {
  approvePartnerPayout,
  cancelPartnerPayout,
} from "@/lib/finance/payout";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { error } = await requireAdmin({
    path: "/api/admin/financeiro/payouts",
  });
  if (error) return error;
  const url = new URL(req.url);
  const status = url.searchParams.get("status") || undefined;
  const payouts = await prisma.partnerPayout.findMany({
    where: status ? { status: status as never } : undefined,
    orderBy: { requestedAt: "desc" },
    take: 100,
  });
  return apiSuccess({ payouts });
}

export async function POST(req: Request) {
  const { user, error } = await requireAdmin({
    path: "/api/admin/financeiro/payouts",
  });
  if (error) return error;

  const body = await req.json().catch(() => ({}));
  const action = String(body.action || "");
  const payoutId = String(body.payoutId || "");

  if (!payoutId) return apiFailure("VALIDATION", "payoutId obrigatório", 400);

  if (action === "approve") {
    const r = await approvePartnerPayout({ payoutId, approvedById: user!.id });
    if (!r.ok) return apiFailure(r.code, r.message, 400);
    return apiSuccess(r);
  }
  if (action === "mark_paid_sandbox") {
    return apiFailure(
      "PAYOUT_PROVIDER_NOT_CONFIGURED",
      "Repasse só pode ser marcado como pago após confirmação externa real.",
      409,
    );
  }

  if (action === "cancel") {
    const r = await cancelPartnerPayout({
      payoutId,
      actorId: user!.id,
      reason: String(body.reason || "admin_cancel"),
    });
    if (!r.ok) return apiFailure(r.code, r.message, 400);
    return apiSuccess(r);
  }

  return apiFailure("VALIDATION", "action inválida", 400);
}
