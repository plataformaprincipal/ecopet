import { apiSuccess } from "@/lib/api-response";
import { requireAuth } from "@/lib/auth/require-auth";
import { handleSocialRouteError } from "@/lib/social/api-handler";
import { listAdminPosts } from "@/lib/social/reports";
import { requireAdmin } from "@/lib/social/permissions";

export async function GET(req: Request) {
  try {
    const { user, error } = await requireAuth(["ADMIN"]);
    if (error) return error;
    await requireAdmin(user!.id);
    const url = new URL(req.url);
    const data = await listAdminPosts({
      status: url.searchParams.get("status") ?? undefined,
      cursor: url.searchParams.get("cursor") ?? undefined,
      limit: Number(url.searchParams.get("limit") ?? "20"),
    });
    return apiSuccess(data);
  } catch (e) {
    return handleSocialRouteError(e);
  }
}
