import { apiFailure, apiSuccess } from "@/lib/api-response";
import { requireAdmin } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { error } = await requireAdmin({ path: "/api/admin/financeiro/ledger" });
  if (error) return error;

  const url = new URL(req.url);
  const partnerId = url.searchParams.get("partnerId") || undefined;
  const orderId = url.searchParams.get("orderId") || undefined;
  const paymentId = url.searchParams.get("paymentId") || undefined;
  const take = Math.min(200, Number(url.searchParams.get("take") || 50));

  const entries = await prisma.financialLedgerEntry.findMany({
    where: {
      ...(partnerId ? { partnerId } : {}),
      ...(orderId ? { orderId } : {}),
      ...(paymentId ? { paymentId } : {}),
    },
    orderBy: { createdAt: "desc" },
    take,
  });

  return apiSuccess({ entries });
}

export async function PATCH() {
  return apiFailure("FORBIDDEN", "Edição direta de lançamentos não permitida", 403);
}

export async function DELETE() {
  return apiFailure("FORBIDDEN", "Exclusão de lançamentos não permitida", 403);
}
