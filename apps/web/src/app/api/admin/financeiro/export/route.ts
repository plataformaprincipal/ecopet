import { requireAdmin } from "@/lib/auth/guards";
import { writeAuditLog } from "@/lib/audit-log";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function csvEscape(v: unknown): string {
  const s = v == null ? "" : String(v);
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

/** Exportação CSV — sem secrets / dados de cartão. */
export async function GET(req: Request) {
  const { user, error } = await requireAdmin({ path: "/api/admin/financeiro/export" });
  if (error) return error;

  const url = new URL(req.url);
  const type = url.searchParams.get("type") || "ledger";
  const partnerId = url.searchParams.get("partnerId") || undefined;

  let header: string[] = [];
  let rows: string[][] = [];

  if (type === "ledger") {
    header = ["id", "entryType", "direction", "amountCents", "status", "partnerId", "orderId", "paymentId", "occurredAt"];
    const entries = await prisma.financialLedgerEntry.findMany({
      where: partnerId ? { partnerId } : undefined,
      orderBy: { createdAt: "desc" },
      take: 2000,
    });
    rows = entries.map((e) => [
      e.id,
      e.entryType,
      e.direction,
      String(e.amountCents),
      e.status,
      e.partnerId ?? "",
      e.orderId ?? "",
      e.paymentId ?? "",
      e.occurredAt.toISOString(),
    ]);
  } else if (type === "payouts") {
    header = ["id", "partnerId", "amountCents", "status", "requestedAt", "paidAt", "externalReference"];
    const payouts = await prisma.partnerPayout.findMany({
      where: partnerId ? { partnerId } : undefined,
      orderBy: { requestedAt: "desc" },
      take: 2000,
    });
    rows = payouts.map((p) => [
      p.id,
      p.partnerId,
      String(p.amountCents),
      p.status,
      p.requestedAt.toISOString(),
      p.paidAt?.toISOString() ?? "",
      p.externalReference ?? "",
    ]);
  } else if (type === "payments") {
    header = ["id", "orderId", "partnerId", "amount", "status", "providerPaymentId", "createdAt"];
    const payments = await prisma.payment.findMany({
      where: partnerId ? { partnerId } : undefined,
      orderBy: { createdAt: "desc" },
      take: 2000,
      select: {
        id: true,
        orderId: true,
        partnerId: true,
        amount: true,
        status: true,
        providerPaymentId: true,
        createdAt: true,
      },
    });
    rows = payments.map((p) => [
      p.id,
      p.orderId,
      p.partnerId ?? "",
      String(p.amount),
      p.status,
      p.providerPaymentId ?? "",
      p.createdAt.toISOString(),
    ]);
  } else if (type === "reconciliation") {
    header = ["id", "paymentId", "status", "expectedAmountCents", "receivedAmountCents", "createdAt"];
    const rec = await prisma.financialReconciliation.findMany({
      orderBy: { createdAt: "desc" },
      take: 2000,
    });
    rows = rec.map((r) => [
      r.id,
      r.paymentId ?? "",
      r.status,
      String(r.expectedAmountCents ?? ""),
      String(r.receivedAmountCents ?? ""),
      r.createdAt.toISOString(),
    ]);
  } else if (type === "refunds") {
    header = ["id", "paymentId", "orderId", "amount", "status", "requestedAt"];
    const refunds = await prisma.paymentRefund.findMany({
      orderBy: { createdAt: "desc" },
      take: 2000,
    });
    rows = refunds.map((r) => [
      r.id,
      r.paymentId,
      r.orderId,
      String(r.amount),
      r.status,
      r.requestedAt.toISOString(),
    ]);
  } else {
    return new Response(JSON.stringify({ error: "INVALID_TYPE" }), { status: 400 });
  }

  const csv = [header.map(csvEscape).join(","), ...rows.map((r) => r.map(csvEscape).join(","))].join(
    "\n"
  );

  await writeAuditLog({
    action: "EXPORT",
    module: "finance",
    resource: "Export",
    resourceId: type,
    actorId: user!.id,
    observation: "finance.export.csv",
    entityAfter: { type, rows: rows.length, tz: "UTC" },
  }).catch(() => undefined);

  return new Response(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="eccopet-${type}-${Date.now()}.csv"`,
    },
  });
}
