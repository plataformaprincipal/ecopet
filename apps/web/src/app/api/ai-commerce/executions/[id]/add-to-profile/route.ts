import { z } from "zod";
import { apiFailure, apiSuccess } from "@/lib/api-response";
import { requireAuth } from "@/lib/auth/require-auth";
import { handleAiCommerceError } from "@/lib/ai-commerce/http";
import { addExecutionToHealthProfile } from "@/lib/ai-commerce/health-profile-actions";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

const bodySchema = z.object({
  items: z.array(z.string().min(1)).min(1).max(20),
});

export async function POST(request: Request, ctx: Ctx) {
  const { user, error } = await requireAuth();
  if (error) return error;
  const { id } = await ctx.params;
  const parsed = bodySchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return apiFailure("VALIDATION", "Selecione o que será adicionado.", 400);
  try {
    const data = await addExecutionToHealthProfile({
      userId: user!.id,
      executionId: id,
      items: parsed.data.items,
    });
    return apiSuccess(data);
  } catch (e) {
    return handleAiCommerceError(e);
  }
}
