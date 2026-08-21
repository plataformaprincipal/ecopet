import { apiFailure, apiSuccess } from "@/lib/api-response";
import { requireAuth } from "@/lib/auth/require-auth";
import { prisma } from "@/lib/prisma";
import { assertPetOwned } from "@/lib/ai-commerce/entitlement-service";
import { getProductDefBySku } from "@/lib/ai-commerce/catalog";
import { handleAiCommerceError } from "@/lib/ai-commerce/http";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ petId: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  const { user, error } = await requireAuth();
  if (error) return error;
  const { petId } = await ctx.params;
  try {
    await assertPetOwned(user!.id, petId);
    const executions = await prisma.aIExecution.findMany({
      where: { userId: user!.id, petId, status: "COMPLETED" },
      orderBy: { completedAt: "desc" },
      include: { entitlement: { select: { sku: true } } },
      take: 50,
    });
    return apiSuccess({
      items: executions.map((e) => {
        const def = getProductDefBySku(e.entitlement.sku);
        const output = (e.structuredOutput ?? {}) as Record<string, unknown>;
        return {
          id: e.id,
          date: e.completedAt ?? e.createdAt,
          sku: e.entitlement.sku,
          name: def?.name ?? e.entitlement.sku,
          summary: String(output.summary ?? output.overview ?? output.examName ?? def?.tag ?? ""),
          href: def?.workspaceHref(e.id),
        };
      }),
    });
  } catch (e) {
    return handleAiCommerceError(e);
  }
}
