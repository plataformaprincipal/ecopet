import { z } from "zod";
import { apiSuccess } from "@/lib/api-response";
import { requireAuth } from "@/lib/auth/require-auth";
import { prisma } from "@/lib/prisma";
import { getOwnedExecution } from "@/lib/ai-commerce/execution-service";
import { handleAiCommerceError } from "@/lib/ai-commerce/http";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(request: Request, ctx: Ctx) {
  const { user, error } = await requireAuth();
  if (error) return error;
  const { id } = await ctx.params;
  try {
    await getOwnedExecution(user!.id, id);
    const parsed = z.object({ helpful: z.boolean(), comment: z.string().max(500).optional() }).safeParse(await request.json());
    if (!parsed.success) return apiSuccess({ ok: false });
    await prisma.aICommerceFeedback.upsert({
      where: { executionId: id },
      create: { userId: user!.id, executionId: id, helpful: parsed.data.helpful, comment: parsed.data.comment },
      update: { helpful: parsed.data.helpful, comment: parsed.data.comment },
    });
    return apiSuccess({ ok: true });
  } catch (e) {
    return handleAiCommerceError(e);
  }
}
