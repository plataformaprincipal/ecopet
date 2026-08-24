import { apiSuccess } from "@/lib/api-response";
import { requireAuth } from "@/lib/auth/require-auth";
import { handleAiCommerceError, enforceAiCommerceRateLimit } from "@/lib/ai-commerce/http";
import { generateEducationalImage } from "@/lib/ai-commerce/image-generation";
import { ImageGenerationLimitError } from "@/lib/ai/modules/services/generate-image";
import { AiCommerceError } from "@/lib/ai-commerce/errors";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(_req: Request, ctx: Ctx) {
  const { user, error } = await requireAuth();
  if (error) return error;
  const { id } = await ctx.params;
  const limited = await enforceAiCommerceRateLimit(`ai-image:${user!.id}`, 8);
  if (limited) return limited;
  try {
    const data = await generateEducationalImage({
      userId: user!.id,
      role: String(user!.role ?? "CLIENT"),
      executionId: id,
    });
    return apiSuccess(data);
  } catch (e) {
    if (e instanceof ImageGenerationLimitError) {
      return handleAiCommerceError(new AiCommerceError("RATE_LIMIT", e.message, 429));
    }
    return handleAiCommerceError(e);
  }
}
