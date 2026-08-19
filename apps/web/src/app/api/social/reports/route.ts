import { apiSuccess } from "@/lib/api-response";
import { requireAuth } from "@/lib/auth/require-auth";
import { handleSocialRouteError } from "@/lib/social/api-handler";
import { SocialError } from "@/lib/social/errors";
import { createReport } from "@/lib/social/reports";
import type { SocialReportReason } from "@prisma/client";

export async function POST(req: Request) {
  try {
    const { user, error } = await requireAuth();
    if (error) return error;
    let body: { postId?: string; commentId?: string; reason?: string; description?: string } = {};
    try {
      body = await req.json();
    } catch {
      return handleSocialRouteError(new SocialError("Payload inválido.", "VALIDATION", 400));
    }
    const report = await createReport({
      reporterId: user!.id,
      postId: body.postId,
      commentId: body.commentId,
      reason: body.reason as SocialReportReason,
      description: body.description,
    });
    return apiSuccess({ report }, 201);
  } catch (e) {
    return handleSocialRouteError(e);
  }
}
