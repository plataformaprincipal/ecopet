import { apiSuccess } from "@/lib/api-response";
import { requireAuth } from "@/lib/auth/require-auth";
import { handleSocialRouteError } from "@/lib/social/api-handler";
import { getAdminReport, updateAdminReport } from "@/lib/social/reports";
import { requireAdmin } from "@/lib/social/permissions";

type Params = { params: Promise<{ reportId: string }> };

export async function GET(_req: Request, { params }: Params) {
  try {
    const { user, error } = await requireAuth(["ADMIN"]);
    if (error) return error;
    await requireAdmin(user!.id);
    const { reportId } = await params;
    const report = await getAdminReport(reportId);
    return apiSuccess({ report });
  } catch (e) {
    return handleSocialRouteError(e);
  }
}

export async function PATCH(req: Request, { params }: Params) {
  try {
    const { user, error } = await requireAuth(["ADMIN"]);
    if (error) return error;
    await requireAdmin(user!.id);
    const { reportId } = await params;
    const body = await req.json();
    const report = await updateAdminReport({
      reportId,
      adminId: user!.id,
      status: body.status,
      resolution: body.resolution,
    });
    return apiSuccess({ report });
  } catch (e) {
    return handleSocialRouteError(e);
  }
}
