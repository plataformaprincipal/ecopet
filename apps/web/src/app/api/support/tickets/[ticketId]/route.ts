import { UserRole } from "@prisma/client";
import { apiSuccess } from "@/lib/api-response";
import { requireAuth } from "@/lib/auth/require-auth";
import { handleChatRouteError } from "@/lib/messages/api-handler";
import { getSupportTicket } from "@/lib/messages/support";

type Params = { params: Promise<{ ticketId: string }> };

export async function GET(_req: Request, { params }: Params) {
  try {
    const { user, error } = await requireAuth();
    if (error) return error;
    const { ticketId } = await params;
    const isAdmin = user!.role === UserRole.ADMIN;
    const ticket = await getSupportTicket(ticketId, user!.id, isAdmin);
    return apiSuccess({ ticket });
  } catch (e) {
    return handleChatRouteError(e);
  }
}
