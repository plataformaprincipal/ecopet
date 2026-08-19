import { apiSuccess, apiFailure } from "@/lib/api-response";
import { requireAuth } from "@/lib/auth/require-auth";
import { handleSocialRouteError } from "@/lib/social/api-handler";
import { hidePostForViewer } from "@/lib/social/posts";

type Params = { params: Promise<{ postId: string }> };

export async function POST(req: Request, { params }: Params) {
  try {
    const { user, error } = await requireAuth();
    if (error) return error;
    const { postId } = await params;
    const body = (await req.json().catch(() => ({}))) as { kind?: string };
    const kind = body.kind === "NOT_INTERESTED" ? "NOT_INTERESTED" : "HIDE";
    if (kind !== "HIDE" && kind !== "NOT_INTERESTED") {
      return apiFailure("VALIDATION", "Sinal inválido.", 400);
    }
    const data = await hidePostForViewer({ postId, userId: user!.id, kind });
    return apiSuccess(data);
  } catch (e) {
    return handleSocialRouteError(e);
  }
}
