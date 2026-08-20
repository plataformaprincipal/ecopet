import { apiFailure, apiSuccess } from "@/lib/api-response";
import { requireAdmin } from "@/lib/auth/guards";
import { loadSettlementForOrder } from "@/lib/finance/settlement-load";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { error } = await requireAdmin({ path: "/api/admin/financeiro/settlement" });
  if (error) return error;
  const url = new URL(req.url);
  const orderId = url.searchParams.get("orderId")?.trim();
  const paymentId = url.searchParams.get("paymentId")?.trim();
  if (!orderId && !paymentId) return apiFailure("VALIDATION", "orderId ou paymentId obrigatório", 400);

  let resolvedOrderId = orderId ?? null;
  if (resolvedOrderId) {
    const existing = await prisma.order.findUnique({ where: { id: resolvedOrderId }, select: { id: true } });
    if (!existing) resolvedOrderId = null;
  }
  if (!resolvedOrderId && (paymentId || orderId)) {
    const pay = await prisma.payment.findUnique({
      where: { id: paymentId || orderId! },
      select: { orderId: true },
    });
    resolvedOrderId = pay?.orderId ?? null;
  }
  if (!resolvedOrderId) return apiFailure("NOT_FOUND", "Pedido não encontrado.", 404);
  const settlement = await loadSettlementForOrder(resolvedOrderId);
  if (!settlement) return apiFailure("NOT_FOUND", "Pedido não encontrado.", 404);
  return apiSuccess({ settlement });
}
