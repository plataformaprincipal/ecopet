import { UserRole } from "@prisma/client";
import { apiSuccess } from "@/lib/api-response";
import { requireAuth } from "@/lib/auth/require-auth";
import { handleChatRouteError } from "@/lib/messages/api-handler";
import { listMessageReports, getMessageReport, reviewMessageReport } from "@/lib/messages/reports";

export async function GET(req: Request) {
  try {
    const { user, error } = await requireAuth([UserRole.ADMIN]);
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
