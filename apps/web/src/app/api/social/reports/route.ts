import { apiSuccess } from "@/lib/api-response";
import { requireAuth } from "@/lib/auth/require-auth";
import { handleSocialRouteError } from "@/lib/social/api-handler";
import { createReport } from "@/lib/social/reports";
import type { SocialReportReason } from "@prisma/client";

export async function POST(req: Request) {
  try {
    const { user, error } = await requireAuth();
    if (error) return error;
    const body = await req.json();
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
