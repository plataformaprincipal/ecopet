import { UserRole } from "@prisma/client";
import { z } from "zod";
import { apiFailure, apiSuccess } from "@/lib/api-response";
import { requireRole } from "@/lib/auth/require-auth";
import {
  getActiveCheckoutPaymentMethods,
  setPaymentMethodEnabled,
  syncPaymentMethodConfigurations,
} from "@/lib/mercado-pago/payment-methods";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const { user, error } = await requireRole(UserRole.ADMIN);
  if (error) return error;

  const all = await prisma.paymentMethodConfiguration.findMany({
    orderBy: { methodId: "asc" },
  });
  const active = await getActiveCheckoutPaymentMethods();
  return apiSuccess({
    methods: all,
    activeCheckout: active,
    actorId: user!.id,
  });
}

const patchSchema = z.object({
  action: z.enum(["sync", "set_enabled"]),
  methodId: z.string().optional(),
  enabled: z.boolean().optional(),
});

export async function POST(request: Request) {
  const { user, error } = await requireRole(UserRole.ADMIN);
  if (error) return error;

  const parsed = patchSchema.safeParse(await request.json());
  if (!parsed.success) return apiFailure("VALIDATION", "Dados inválidos.", 400);

  if (parsed.data.action === "sync") {
    const result = await syncPaymentMethodConfigurations(user!.id);
    if (!result.ok) return apiFailure(result.code, "Falha ao sincronizar meios.", 503);
    return apiSuccess({ methods: result.methods });
  }

  if (!parsed.data.methodId || parsed.data.enabled === undefined) {
    return apiFailure("VALIDATION", "methodId e enabled obrigatórios.", 400);
  }
  const result = await setPaymentMethodEnabled({
    methodId: parsed.data.methodId,
    enabled: parsed.data.enabled,
    actorId: user!.id,
  });
  if (!result.ok) return apiFailure(result.code, result.message, 400);
  return apiSuccess({ method: result.method });
}
