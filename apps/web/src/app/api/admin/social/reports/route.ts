import { apiSuccess } from "@/lib/api-response";
import { requireAdmin } from "@/lib/auth/guards";
import { handleSocialRouteError } from "@/lib/social/api-handler";
import { listAdminReports } from "@/lib/social/reports";

export async function GET(req: Request) {
  try {
    const { error } = await requireAdmin({ path: new URL(req.url).pathname });
    if (error) return error;
    const url = new URL(req.url);
    const data = await listAdminReports({
      status: url.searchParams.get("status") ?? undefined,
      cursor: url.searchParams.get("cursor") ?? undefined,
      limit: Number(url.searchParams.get("limit") ?? "20"),
    });
    return apiSuccess(data);
  } catch (e) {
    return handleSocialRouteError(e);
  }
}
