import { z } from "zod";
import { apiFailure, apiSuccess } from "@/lib/api-response";
import { requireAuth } from "@/lib/auth/require-auth";
import { startOrGetExecution } from "@/lib/ai-commerce/execution-service";
import { enforceAiCommerceRateLimit, handleAiCommerceError } from "@/lib/ai-commerce/http";
import { isAiCommerceSku } from "@/lib/ai-commerce/flags";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  entitlementId: z.string().min(1).optional(),
  sku: z.string().optional(),
  petId: z.string().optional(),
});

export async function POST(request: Request) {
  const { user, error } = await requireAuth();
  if (error) return error;
  const limited = await enforceAiCommerceRateLimit(`ai-exec:${user!.id}`, 20);
  if (limited) return limited;
  const parsed = bodySchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return apiFailure("VALIDATION", "Dados inválidos.", 400);

  try {
    let entitlementId = parsed.data.entitlementId;
    if (!entitlementId) {
      if (!parsed.data.sku || !isAiCommerceSku(parsed.data.sku) || !parsed.data.petId) {
        return apiFailure("VALIDATION", "Informe a utilização ou o produto e o pet.", 400);
      }
      const found = await prisma.aIEntitlement.findFirst({
        where: {
          userId: user!.id,
          sku: parsed.data.sku,
          petId: parsed.data.petId,
          status: { in: ["AVAILABLE", "IN_USE"] },
        },
        orderBy: { purchasedAt: "asc" },
      });
      if (!found) return apiFailure("ENTITLEMENT_UNAVAILABLE", "Nenhuma utilização disponível. Compre para continuar.", 409);
      entitlementId = found.id;
    }
    const { execution, entitlement } = await startOrGetExecution({
      userId: user!.id,
      entitlementId,
    });
    return apiSuccess({ executionId: execution.id, entitlementId: entitlement.id, status: execution.status });
  } catch (e) {
    return handleAiCommerceError(e);
  }
}
