import { UserRole } from "@prisma/client";
import { apiSuccess } from "@/lib/api-response";
import { requireAuth } from "@/lib/auth/require-auth";
import { handleChatRouteError } from "@/lib/messages/api-handler";
import { listSupportTickets } from "@/lib/messages/support";

export async function GET(req: Request) {
  try {
    const { user, error } = await requireAuth([UserRole.ADMIN]);
    if (error) return error;
    const url = new URL(req.url);
    const data = await listSupportTickets({
      userId: user!.id,
      isAdmin: true,
      q: url.searchParams.get("q") ?? undefined,
      page: Number(url.searchParams.get("page") ?? "1"),
    });
    return apiSuccess(data);
  } catch (e) {
    return handleChatRouteError(e);
  }
}
