import { UserRole } from "@prisma/client";
import { apiFailure, apiSuccess } from "@/lib/api-response";
import { requireRole } from "@/lib/auth/require-auth";
import { prisma } from "@/lib/prisma";
import { refundableBalance } from "@/lib/mercado-pago/refunds";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { error } = await requireRole(UserRole.ADMIN);
  if (error) return error;

  const url = new URL(request.url);
  const status = url.searchParams.get("status") || undefined;
  const q = url.searchParams.get("q")?.trim();
  const take = Math.min(100, Number(url.searchParams.get("take") || 40));

  const payments = await prisma.payment.findMany({
    where: {
      provider: "mercado_pago",
      ...(status ? { status } : {}),
      ...(q
        ? {
            OR: [
              { id: { contains: q } },
              { orderId: { contains: q } },
              { externalReference: { contains: q } },
              { providerPaymentId: { contains: q } },
            ],
          }
        : {}),
    },
    orderBy: { createdAt: "desc" },
    take,
    include: {
      order: {
        select: {
          id: true,
          orderNumber: true,
          status: true,
          total: true,
          userId: true,
          partnerId: true,
          user: { select: { id: true, name: true, email: true } },
          partner: { select: { id: true, name: true } },
        },
      },
    },
  });

  return apiSuccess({
    payments: payments.map((p) => ({
      id: p.id,
      orderId: p.orderId,
      orderNumber: p.order.orderNumber,
      orderStatus: p.order.status,
      clientName: p.order.user.name,
      partnerName: p.order.partner?.name ?? null,
      paymentMethod: p.paymentMethod,
      paymentType: p.paymentType,
      installments: p.installments,
      amount: p.amount,
      refundedAmount: p.refundedAmount,
      refundableBalance: refundableBalance(p),
      currency: p.currency,
      status: p.status,
      statusDetail: p.statusDetail,
      environment: p.environment,
      providerOrderIdMasked: p.providerOrderId
        ? `${p.providerOrderId.slice(0, 6)}…`
        : null,
      providerPaymentIdMasked: p.providerPaymentId
        ? `${p.providerPaymentId.slice(0, 6)}…`
        : null,
      approvedAt: p.approvedAt,
      expiresAt: p.expiresAt,
      createdAt: p.createdAt,
    })),
  });
}
