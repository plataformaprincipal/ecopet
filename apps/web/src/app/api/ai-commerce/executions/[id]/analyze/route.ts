import { apiSuccess } from "@/lib/api-response";
import { requireAuth } from "@/lib/auth/require-auth";
import { runExecution } from "@/lib/ai-commerce/execution-service";
import { enforceAiCommerceEndpointLimits, handleAiCommerceError } from "@/lib/ai-commerce/http";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: Request, ctx: Ctx) {
  const { user, error } = await requireAuth();
  if (error) return error;
  const { id } = await ctx.params;
  const limited = await enforceAiCommerceEndpointLimits({
    request: req,
    userId: user!.id,
    endpoint: "analyze",
    extraKey: id,
  });
  if (limited) return limited;
  try {
    const assets = await prisma.aIUploadedAsset.findMany({
      where: { executionId: id, userId: user!.id, status: "READY" },
    });
    void assets;
    const execution = await runExecution({ userId: user!.id, executionId: id });
    return apiSuccess({
      id: execution.id,
      status: execution.status,
      structuredOutput: execution.structuredOutput,
    });
  } catch (e) {
    return handleAiCommerceError(e);
  }
}
