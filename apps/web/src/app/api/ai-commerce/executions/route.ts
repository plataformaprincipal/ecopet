import { z } from "zod";
import { apiFailure, apiSuccess } from "@/lib/api-response";
import { requireAuth } from "@/lib/auth/require-auth";
import { grantFreeBetaEntitlement } from "@/lib/ai-commerce/entitlement-service";
import { startOrGetExecution } from "@/lib/ai-commerce/execution-service";
import { enforceAiCommerceRateLimit, handleAiCommerceError } from "@/lib/ai-commerce/http";
import { isAiCommerceSku, isAiMonetizationFree } from "@/lib/ai-commerce/flags";
import { AI_TOOL_GLOBAL_HOURLY_LIMIT, AI_TOOL_RATE_WINDOW_MS, aiToolHourlyLimit } from "@/lib/ai-commerce/rate-policy";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  entitlementId: z.string().min(1).optional(),
  sku: z.string().optional(),
  petId: z.string().optional(),
});

export async function POST(request: Request) {
  const { user, error } = await requireAuth();
  if (error) {
    return apiFailure("AUTH_REQUIRED", "Entre na sua conta para usar esta ferramenta.", 401);
  }
  const parsed = bodySchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return apiFailure("VALIDATION", "Dados inválidos.", 400);

  const sku = parsed.data.sku;
  const globalLimited = await enforceAiCommerceRateLimit(
    `ai-exec-global:${user!.id}`,
    AI_TOOL_GLOBAL_HOURLY_LIMIT,
    AI_TOOL_RATE_WINDOW_MS
  );
  if (globalLimited) return globalLimited;
  if (sku && isAiCommerceSku(sku)) {
    const toolLimited = await enforceAiCommerceRateLimit(
      `ai-exec-tool:${user!.id}:${sku}`,
      aiToolHourlyLimit(sku),
      AI_TOOL_RATE_WINDOW_MS
    );
    if (toolLimited) return toolLimited;
  }

  try {
    let entitlementId = parsed.data.entitlementId;
    if (!entitlementId) {
      if (!sku || !isAiCommerceSku(sku) || !parsed.data.petId) {
        return apiFailure("VALIDATION", "Selecione um pet antes de continuar.", 400);
      }
      if (isAiMonetizationFree()) {
        const granted = await grantFreeBetaEntitlement({
          userId: user!.id,
          petId: parsed.data.petId,
          sku,
        });
        entitlementId = granted.id;
      } else {
        const found = await prisma.aIEntitlement.findFirst({
          where: {
            userId: user!.id,
            sku,
            petId: parsed.data.petId,
            status: { in: ["AVAILABLE", "IN_USE"] },
          },
          orderBy: { purchasedAt: "asc" },
        });
        if (!found) {
          return apiFailure("ENTITLEMENT_UNAVAILABLE", "Nenhuma utilização disponível para esta ferramenta.", 409);
        }
        entitlementId = found.id;
      }
    }
    const { execution, entitlement } = await startOrGetExecution({
      userId: user!.id,
      entitlementId,
    });
    return apiSuccess({
      executionId: execution.id,
      entitlementId: entitlement.id,
      status: execution.status,
    });
  } catch (e) {
    return handleAiCommerceError(e);
  }
}
