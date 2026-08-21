import { apiFailure, apiSuccess } from "@/lib/api-response";
import { requireAuth } from "@/lib/auth/require-auth";
import { handleSocialRouteError } from "@/lib/social/api-handler";
import { createStory, listActiveStories } from "@/lib/social/stories";

export async function GET() {
  try {
    const stories = await listActiveStories();
    return apiSuccess({ stories });
  } catch (e) {
    return handleSocialRouteError(e);
  }
}

export async function POST(req: Request) {
  try {
    const { user, error } = await requireAuth();
    if (error) return error;
    const body = await req.json();
    const mediaUrl = typeof body.mediaUrl === "string" ? body.mediaUrl : "";
    const mimeType = typeof body.mimeType === "string" ? body.mimeType : "";
    const fileSize = Number(body.fileSize ?? 0);
    if (!mediaUrl) return apiFailure("VALIDATION", "Envie uma imagem ou vídeo.", 400);
    const story = await createStory({
      authorId: user!.id,
      content: typeof body.content === "string" ? body.content : undefined,
      mediaUrl,
      mimeType,
      fileSize,
    });
    return apiSuccess({ story }, 201);
  } catch (e) {
    return handleSocialRouteError(e);
  }
}
