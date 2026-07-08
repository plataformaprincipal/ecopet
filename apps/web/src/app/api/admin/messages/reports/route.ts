import { apiSuccess } from "@/lib/api-response";
import { requireAdmin } from "@/lib/auth/guards";
import { handleChatRouteError } from "@/lib/messages/api-handler";
import { listMessageReports } from "@/lib/messages/reports";

export async function GET(req: Request) {
  try {
    const { user, error } = await requireAdmin({ path: new URL(req.url).pathname });
    if (error) return error;
    const url = new URL(req.url);
    const data = await listMessageReports({
      adminId: user!.id,
      status: (url.searchParams.get("status") as never) ?? undefined,
      page: Number(url.searchParams.get("page") ?? "1"),
    });
    return apiSuccess(data);
  } catch (e) {
    return handleChatRouteError(e);
  }
}
