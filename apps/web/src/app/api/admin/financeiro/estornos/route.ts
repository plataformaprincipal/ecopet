import { UserRole } from "@prisma/client";
import { z } from "zod";
import { apiFailure, apiSuccess } from "@/lib/api-response";
import { requireRole } from "@/lib/auth/require-auth";
import { prisma } from "@/lib/prisma";
import { executePaymentRefund } from "@/lib/mercado-pago/refunds";
import { checkRateLimit, clientIp } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { error } = await requireRole(UserRole.ADMIN);
  if (error) return error;

  const url = new URL(request.url);
  const status = url.searchParams.get("status") || undefined;

  const rows = await prisma.paymentRefund.findMany({
    where: status ? { status } : undefined,
    orderBy: { createdAt: "desc" },
    take: 80,
    include: {
      order: { select: { orderNumber: true, userId: true, partnerId: true } },
      payment: {
        select: {
          id: true,
          amount: true,
          refundedAmount: true,
          status: true,
          paymentMethod: true,
        },
      },
      requestedBy: { select: { id: true, name: true, role: true } },
      approvedBy: { select: { id: true, name: true } },
    },
  });

  return apiSuccess({
    refunds: rows.map((r) => ({
      id: r.id,
      paymentId: r.paymentId,
      orderId: r.orderId,
      orderNumber: r.order.orderNumber,
      type: r.type,
      amount: r.amount,
      reason: r.reason,
      status: r.status,
      providerRefundIdMasked: r.providerRefundId
        ? `${r.providerRefundId.slice(0, 6)}…`
        : null,
      stockReturnStatus: r.stockReturnStatus,
      requestedBy: r.requestedBy
        ? { id: r.requestedBy.id, name: r.requestedBy.name, role: r.requestedBy.role }
        : null,
      approvedBy: r.approvedBy
        ? { id: r.approvedBy.id, name: r.approvedBy.name }
        : null,
      paymentAmount: r.payment.amount,
      paymentRefundedAmount: r.payment.refundedAmount,
      paymentMethod: r.payment.paymentMethod,
      requestedAt: r.requestedAt,
      processedAt: r.processedAt,
      failureReason: r.failureReason,
    })),
  });
}

const postSchema = z.object({
  paymentId: z.string().min(1),
  paymentRefundId: z.string().optional(),
  full: z.boolean().optional(),
  amount: z.number().positive().optional(),
  reason: z.string().min(5).max(500),
  internalReason: z.string().max(500).optional(),
  action: z.enum(["execute", "reject"]).default("execute"),
});

export async function POST(request: Request) {
  const { user, error } = await requireRole(UserRole.ADMIN);
  if (error) return error;

  const ip = clientIp(request);
  if (!checkRateLimit(`admin-refund:${user!.id}:${ip}`, 20, 60_000)) {
    return apiFailure("RATE_LIMIT", "Limite de estornos administrativos.", 429);
  }

  const body = await request.json();
  const parsed = postSchema.safeParse(body);
  if (!parsed.success) {
    return apiFailure("VALIDATION", "Dados inválidos para estorno.", 400);
  }

  if (parsed.data.action === "reject") {
    if (!parsed.data.paymentRefundId) {
      return apiFailure("VALIDATION", "paymentRefundId obrigatório para rejeitar.", 400);
    }
    const updated = await prisma.paymentRefund.updateMany({
      where: {
        id: parsed.data.paymentRefundId,
        status: { in: ["REQUESTED", "UNDER_REVIEW"] },
      },
      data: {
        status: "REJECTED",
        approvedById: user!.id,
        internalReason: parsed.data.internalReason ?? parsed.data.reason,
        processedAt: new Date(),
      },
    });
    if (!updated.count) {
      return apiFailure("NOT_FOUND", "Solicitação não encontrada ou já processada.", 404);
    }
    return apiSuccess({ rejected: true });
  }

  const result = await executePaymentRefund({
    paymentId: parsed.data.paymentId,
    adminId: user!.id,
    amount: parsed.data.amount,
    full: parsed.data.full,
    reason: parsed.data.reason,
    internalReason: parsed.data.internalReason,
    paymentRefundId: parsed.data.paymentRefundId,
  });

  if (!result.ok) {
    return apiFailure(result.code, result.message, 400);
  }
  return apiSuccess(result);
}
