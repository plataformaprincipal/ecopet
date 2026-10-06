import { z } from "zod";
import { apiFailure, apiSuccess } from "@/lib/api-response";
import { requireClient } from "@/lib/auth/require-auth";
import { getOrCreateCart, serializeCart } from "@/lib/cart/cart-service";
import { fetchOfficialInstallments } from "@/lib/mercado-pago/payment-methods";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  orderId: z.string().min(1).optional(),
  amount: z.number().positive().optional(),
  bin: z.string().regex(/^\d{6,8}$/, "BIN incompleto"),
  paymentMethodId: z.string().min(1).optional(),
});

export async function POST(request: Request) {
  const { user, error } = await requireClient();
  if (error) return error;

  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) {
    return apiFailure("VALIDATION", "Informe um BIN válido e um valor maior que zero.", 400);
  }

  let amount = Number(parsed.data.amount ?? 0);
  if (parsed.data.orderId) {
    const order = await prisma.order.findUnique({
      where: { id: parsed.data.orderId },
      select: { id: true, userId: true, total: true },
    });
    if (!order || order.userId !== user!.id) {
      return apiFailure("FORBIDDEN", "Pedido inválido.", 403);
    }
    amount = Number(order.total);
  } else if (!(amount > 0)) {
    const cart = await serializeCart(await getOrCreateCart(user!.id));
    amount = Number(cart.summary?.oneTimeTotal ?? cart.subtotal ?? 0);
  }

  if (!(amount > 0)) {
    return apiFailure("INVALID_AMOUNT", "Não foi possível calcular as parcelas.", 400);
  }

  const result = await fetchOfficialInstallments({
    amount,
    bin: parsed.data.bin,
    paymentMethodId: parsed.data.paymentMethodId,
  });

  if (!result.ok) {
    return apiFailure(result.code, "Não foi possível calcular as parcelas.", 503);
  }
  return apiSuccess({ options: result.options, amount });
}
