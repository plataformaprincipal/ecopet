import { apiFailure, apiSuccess } from "@/lib/api-response";
import { requireAuth } from "@/lib/auth/require-auth";
import { handleSocialRouteError } from "@/lib/social/api-handler";
import { deleteOwnStory, getActiveStory } from "@/lib/social/stories";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  try {
    const { id } = await ctx.params;
    const story = await getActiveStory(id);
    if (!story) return apiFailure("NOT_FOUND", "Story expirado ou inexistente.", 404);
    return apiSuccess({ story });
  } catch (e) {
    return handleSocialRouteError(e);
  }
}

export async function DELETE(_req: Request, ctx: Ctx) {
  try {
    const { user, error } = await requireAuth();
    if (error) return error;
    const { id } = await ctx.params;
    const result = await deleteOwnStory({ userId: user!.id, storyId: id });
    return apiSuccess(result);
  } catch (e) {
    return handleSocialRouteError(e);
  }
}
