import { apiFailure, apiSuccess } from "@/lib/api-response";
import { requireAdmin } from "@/lib/auth/guards";
import { openFinancialChargeback, resolveFinancialChargeback } from "@/lib/finance/chargeback";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const { error } = await requireAdmin({ path: "/api/admin/financeiro/chargebacks" });
  if (error) return error;
  const rows = await prisma.financialChargeback.findMany({
    orderBy: { openedAt: "desc" },
    take: 100,
  });
  return apiSuccess({ chargebacks: rows });
}

export async function POST(req: Request) {
  const { user, error } = await requireAdmin({ path: "/api/admin/financeiro/chargebacks" });
  if (error) return error;
  const body = await req.json().catch(() => ({}));

  if (body.action === "resolve") {
    const r = await resolveFinancialChargeback({
      chargebackId: String(body.chargebackId || ""),
      resolution: body.resolution,
      actorId: user!.id,
      note: body.note,
    });
    if (!r.ok) return apiFailure(r.code || "ERROR", "Falha ao resolver", 400);
    return apiSuccess(r);
  }

  const r = await openFinancialChargeback({
    paymentId: String(body.paymentId || ""),
    amount: Number(body.amount),
    reason: body.reason,
    externalReference: body.externalReference,
    idempotencyKey: String(body.idempotencyKey || `cb:${body.paymentId}:${body.amount}`),
  });
  if (!r.ok) return apiFailure(r.code || "ERROR", "Falha ao abrir chargeback", 400);
  return apiSuccess(r);
}
