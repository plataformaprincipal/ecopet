import { apiFailure, apiSuccess } from "@/lib/api-response";
import { requireAdmin } from "@/lib/auth/guards";
import { reconcilePayment, runDailyFinancialReconciliation } from "@/lib/finance/reconciliation";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { error } = await requireAdmin({ path: "/api/admin/financeiro/reconciliation" });
  if (error) return error;
  const url = new URL(req.url);
  const status = url.searchParams.get("status") || undefined;
  const rows = await prisma.financialReconciliation.findMany({
    where: status ? { status: status as never } : undefined,
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  return apiSuccess({ reconciliations: rows });
}

export async function POST(req: Request) {
  const { user, error } = await requireAdmin({ path: "/api/admin/financeiro/reconciliation" });
  if (error) return error;

  const body = await req.json().catch(() => ({}));
  if (body.action === "daily") {
    const key =
      (typeof body.idempotencyKey === "string" && body.idempotencyKey) ||
      `daily:${new Date().toISOString().slice(0, 10)}`;
    const run = await runDailyFinancialReconciliation({
      triggeredBy: user!.id,
      idempotencyKey: key,
      lookbackHours: Number(body.lookbackHours) || 48,
    });
    return apiSuccess({ run });
  }

  const paymentId = String(body.paymentId || "");
  if (!paymentId) return apiFailure("VALIDATION", "paymentId obrigatório", 400);
  const result = await reconcilePayment(paymentId);
  return apiSuccess(result);
}
