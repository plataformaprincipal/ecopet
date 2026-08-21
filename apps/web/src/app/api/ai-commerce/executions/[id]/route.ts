import { z } from "zod";
import { apiFailure, apiSuccess } from "@/lib/api-response";
import { requireAuth } from "@/lib/auth/require-auth";
import { getOwnedExecution, saveExecutionInput } from "@/lib/ai-commerce/execution-service";
import { handleAiCommerceError } from "@/lib/ai-commerce/http";
import { getProductDefBySku } from "@/lib/ai-commerce/catalog";
import { extrasForExecution } from "@/lib/ai-commerce/workspace-extras";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  const { user, error } = await requireAuth();
  if (error) return error;
  const { id } = await ctx.params;
  try {
    const execution = await getOwnedExecution(user!.id, id);
    const def = getProductDefBySku(execution.entitlement.sku);
    const extras = await extrasForExecution({
      userId: user!.id,
      petId: execution.petId,
      sku: execution.entitlement.sku,
      capabilityId: execution.capabilityId,
      output: (execution.structuredOutput as Record<string, unknown> | null) ?? null,
      input: (execution.inputSnapshot as Record<string, unknown> | null) ?? null,
    });
    return apiSuccess({
      id: execution.id,
      status: execution.status,
      sku: execution.entitlement.sku,
      capabilityId: execution.capabilityId,
      inputSnapshot: execution.inputSnapshot,
      structuredOutput: execution.structuredOutput,
      pet: execution.pet,
      product: def,
      reportId: execution.reports[0]?.id ?? null,
      failureCode: execution.failureCode,
      extras,
    });
  } catch (e) {
    return handleAiCommerceError(e);
  }
}

const patchSchema = z.object({
  input: z.record(z.unknown()),
});

export async function PATCH(request: Request, ctx: Ctx) {
  const { user, error } = await requireAuth();
  if (error) return error;
  const { id } = await ctx.params;
  const parsed = patchSchema.safeParse(await request.json());
  if (!parsed.success) return apiFailure("VALIDATION", "Dados inválidos.", 400);
  try {
    const saved = await saveExecutionInput({ userId: user!.id, executionId: id, input: parsed.data.input });
    return apiSuccess({ id: saved.id, status: saved.status });
  } catch (e) {
    return handleAiCommerceError(e);
  }
}
