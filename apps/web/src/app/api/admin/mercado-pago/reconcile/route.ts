import { UserRole } from "@prisma/client";
import { apiFailure, apiSuccess } from "@/lib/api-response";
import { requireRole } from "@/lib/auth/require-auth";
import { runMercadoPagoReconciliation } from "@/lib/mercado-pago/reconciliation";
import { writeAuditLog } from "@/lib/audit-log";
import { checkRateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function POST() {
  const { user, error } = await requireRole(UserRole.ADMIN);
  if (error) return error;
  if (!checkRateLimit(`mp-reconcile:${user!.id}`, 5, 60_000)) {
    return apiFailure("RATE_LIMIT", "Limite de conciliações.", 429);
  }
  const report = await runMercadoPagoReconciliation({ limit: 80 });
  await writeAuditLog({
    actorId: user!.id,
    action: "SYNC",
    module: "admin.mercado_pago",
    resource: "MpReconciliationIssue",
    observation: `Conciliação manual: ${report.issuesCreated} issues`,
  });
  return apiSuccess(report);
}

export async function GET() {
  const { error } = await requireRole(UserRole.ADMIN);
  if (error) return error;
  const { prisma } = await import("@/lib/prisma");
  const issues = await prisma.mpReconciliationIssue.findMany({
    where: { status: "OPEN" },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  return apiSuccess({ issues });
}
