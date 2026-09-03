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

export async function GET(request: Request) {
  const { user, error } = await requireAuth();
  if (error) return error;
  const url = new URL(request.url);
  const sku = url.searchParams.get("sku") ?? undefined;
  const petId = url.searchParams.get("petId") ?? undefined;
  const take = Math.min(20, Math.max(1, Number(url.searchParams.get("take") ?? 8) || 8));
  const where: {
    userId: string;
    status: "COMPLETED";
    entitlement?: { sku: string };
    petId?: string;
  } = { userId: user!.id, status: "COMPLETED" };
  if (sku && isAiCommerceSku(sku)) where.entitlement = { sku };
  if (petId) where.petId = petId;
  const rows = await prisma.aIExecution.findMany({
    where,
    orderBy: { completedAt: "desc" },
    take,
    select: {
      id: true,
      capabilityId: true,
      completedAt: true,
      structuredOutput: true,
      pet: { select: { id: true, name: true } },
      entitlement: { select: { sku: true } },
    },
  });
  return apiSuccess({
    executions: rows.map((row) => {
      const out = (row.structuredOutput ?? {}) as Record<string, unknown>;
      return {
        id: row.id,
        sku: row.entitlement.sku,
        capabilityId: row.capabilityId,
        petId: row.pet.id,
        petName: row.pet.name,
        completedAt: row.completedAt,
        summary: String(out.summary ?? out.clinicalOverview ?? "").slice(0, 220),
      };
    }),
  });
}

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
