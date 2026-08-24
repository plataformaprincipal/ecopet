import { z } from "zod";
import { apiFailure, apiSuccess } from "@/lib/api-response";
import { requireAuth } from "@/lib/auth/require-auth";
import { handleAiCommerceError, enforceAiCommerceRateLimit } from "@/lib/ai-commerce/http";
import { listFollowUp, sendFollowUp } from "@/lib/ai-commerce/follow-up-service";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  const { user, error } = await requireAuth();
  if (error) return error;
  const { id } = await ctx.params;
  try {
    const data = await listFollowUp({ userId: user!.id, executionId: id });
    return apiSuccess(data);
  } catch (e) {
    return handleAiCommerceError(e);
  }
}

const bodySchema = z.object({
  message: z.string().min(2).max(2000),
  locale: z.string().optional(),
});

export async function POST(request: Request, ctx: Ctx) {
  const { user, error } = await requireAuth();
  if (error) return error;
  const { id } = await ctx.params;
  const limited = await enforceAiCommerceRateLimit(`ai-followup:${user!.id}`, 20);
  if (limited) return limited;
  const parsed = bodySchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return apiFailure("VALIDATION", "Escreva uma pergunta sobre esta análise.", 400);
  try {
    const data = await sendFollowUp({
      userId: user!.id,
      executionId: id,
      message: parsed.data.message,
      locale: parsed.data.locale,
    });
    return apiSuccess(data);
  } catch (e) {
    return handleAiCommerceError(e);
  }
}
