import { apiSuccess } from "@/lib/api-response";
import { requireAdmin } from "@/lib/auth/guards";
import { handleChatRouteError } from "@/lib/messages/api-handler";
import { getMessageReport, reviewMessageReport } from "@/lib/messages/reports";

type Params = { params: Promise<{ reportId: string }> };

export async function GET(_req: Request, { params }: Params) {
  try {
    const { user, error } = await requireAdmin({ path: new URL(_req.url).pathname });
    if (error) return error;
    const { reportId } = await params;
    const report = await getMessageReport(reportId, user!.id);
    return apiSuccess({ report });
  } catch (e) {
    return handleChatRouteError(e);
  }
}

export async function PATCH(req: Request, { params }: Params) {
  try {
    const { user, error } = await requireAdmin({ path: new URL(req.url).pathname });
    if (error) return error;
    const { reportId } = await params;
    const body = await req.json();
    const report = await reviewMessageReport({
      reportId,
      adminId: user!.id,
      status: body.status,
      resolution: body.resolution,
      hideMessage: body.hideMessage,
      blockConversation: body.blockConversation,
    });
    return apiSuccess({ report });
  } catch (e) {
    return handleChatRouteError(e);
  }
}
