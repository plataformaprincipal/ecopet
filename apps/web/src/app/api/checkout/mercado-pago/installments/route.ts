import { z } from "zod";
import { apiFailure, apiSuccess } from "@/lib/api-response";
import { requireClient } from "@/lib/auth/require-auth";
import { getOrCreateCart, serializeCart } from "@/lib/cart/cart-service";
import { fetchOfficialInstallments } from "@/lib/mercado-pago/payment-methods";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  orderId: z.string().min(1).optional(),
  bin: z.string().min(6).max(8).optional(),
  paymentMethodId: z.string().optional(),
});

export async function POST(request: Request) {
  const { user, error } = await requireClient();
  if (error) return error;

  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return apiFailure("VALIDATION", "Dados inválidos.", 400);

  let amount = 0;
  if (parsed.data.orderId) {
    const order = await prisma.order.findUnique({
      where: { id: parsed.data.orderId },
      select: { id: true, userId: true, total: true },
    });
    if (!order || order.userId !== user!.id) {
      return apiFailure("FORBIDDEN", "Pedido inválido.", 403);
    }
    amount = Number(order.total);
  } else {
    const cart = serializeCart(await getOrCreateCart(user!.id));
    amount = Number(cart.productSubtotal ?? cart.subtotal);
  }

  if (!(amount > 0)) {
    return apiFailure("INVALID_AMOUNT", "Valor inválido para parcelas.", 400);
  }

  const result = await fetchOfficialInstallments({
    amount,
    bin: parsed.data.bin,
    paymentMethodId: parsed.data.paymentMethodId,
  });

  if (!result.ok) return apiFailure(result.code, "Não foi possível obter parcelas.", 503);
  return apiSuccess({ options: result.options, amount });
}
