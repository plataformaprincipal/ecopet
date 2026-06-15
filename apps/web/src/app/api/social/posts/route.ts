import { apiSuccess } from "@/lib/api-response";
import { requireAuth } from "@/lib/auth/require-auth";
import { handleSocialRouteError } from "@/lib/social/api-handler";
import { createPost } from "@/lib/social/posts";
import { mimeToMediaType } from "@/lib/social/utils";

export async function POST(req: Request) {
  try {
    const { user, error } = await requireAuth();
    if (error) return error;
    const body = await req.json();

    const media = Array.isArray(body.media)
      ? body.media.map((m: { fileUrl: string; fileName: string; mimeType: string; fileSize: number; storageProvider?: string; sortOrder?: number }, i: number) => ({
          fileUrl: m.fileUrl,
          fileName: m.fileName,
          mimeType: m.mimeType,
          fileSize: m.fileSize,
          mediaType: mimeToMediaType(m.mimeType),
          storageProvider: m.storageProvider ?? "local",
          sortOrder: m.sortOrder ?? i,
        }))
      : undefined;

    const post = await createPost({
      authorId: user!.id,
      content: body.content,
      visibility: body.visibility,
      petId: body.petId,
      locationText: body.locationText,
      media,
    });
    return apiSuccess({ post }, 201);
  } catch (e) {
    return handleSocialRouteError(e);
  }
}
