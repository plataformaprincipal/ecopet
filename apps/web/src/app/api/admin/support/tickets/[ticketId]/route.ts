import { apiSuccess } from "@/lib/api-response";
import { requireAdmin } from "@/lib/auth/guards";
import { handleChatRouteError } from "@/lib/messages/api-handler";
import { getSupportTicket } from "@/lib/messages/support";

type Params = { params: Promise<{ ticketId: string }> };

export async function GET(_req: Request, { params }: Params) {
  try {
    const { user, error } = await requireAdmin({ path: new URL(_req.url).pathname });
    if (error) return error;
    const { ticketId } = await params;
    const ticket = await getSupportTicket(ticketId, user!.id, true);
    return apiSuccess({ ticket });
  } catch (e) {
    return handleChatRouteError(e);
  }
}
