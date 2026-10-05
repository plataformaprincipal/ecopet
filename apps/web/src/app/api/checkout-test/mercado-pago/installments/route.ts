import { z } from "zod";
import { apiFailure, apiSuccess } from "@/lib/api-response";
import { requireAuth } from "@/lib/auth/require-auth";
import { prisma } from "@/lib/prisma";
import { isCheckoutTestOrderNotes, isMercadoPagoTestCheckoutConfigured } from "@/lib/mercado-pago/test-credentials";
import { getTestMercadoPagoInstallments } from "@/lib/mercado-pago/test-client";

export const dynamic = "force-dynamic";

const schema = z.object({
  orderId: z.string().min(1),
  bin: z.string().min(6).max(8).optional(),
  paymentMethodId: z.string().optional(),
});

export async function POST(request: Request) {
  const { user, error } = await requireAuth();
  if (error) return error;
  if (!isMercadoPagoTestCheckoutConfigured()) {
    return apiFailure("MP_TEST_NOT_CONFIGURED", "Checkout de teste indisponível.", 503);
  }

  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return apiFailure("VALIDATION", "Dados inválidos.", 400);

  const order = await prisma.order.findUnique({
    where: { id: parsed.data.orderId },
    select: { id: true, userId: true, total: true, deliveryNotes: true },
  });
  if (!order || order.userId !== user!.id || !isCheckoutTestOrderNotes(order.deliveryNotes)) {
    return apiFailure("FORBIDDEN", "Pedido de teste inválido.", 403);
  }

  const amount = Number(order.total);
  if (!(amount > 0)) {
    return apiFailure("INVALID_AMOUNT", "Valor inválido.", 400);
  }

  const result = await getTestMercadoPagoInstallments({
    amount,
    bin: parsed.data.bin,
    paymentMethodId: parsed.data.paymentMethodId,
  });

  if (!result.ok) return apiFailure(result.code, "Não foi possível obter parcelas de teste.", 503);

  const raw = Array.isArray(result.data) ? result.data : [];
  const first = raw[0] as { payer_costs?: Array<Record<string, unknown>> } | undefined;
  const costs = first?.payer_costs ?? [];
  const options = costs.map((c) => ({
    installments: Number(c.installments ?? 1),
    installmentAmount: Number(c.installment_amount ?? 0),
    totalAmount: Number(c.total_amount ?? amount),
    recommendedMessage: String(c.recommended_message ?? ""),
  }));

  return apiSuccess({ options, amount: order.total });
}
