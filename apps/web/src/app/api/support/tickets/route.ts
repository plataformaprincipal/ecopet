import { UserRole } from "@prisma/client";
import { apiSuccess } from "@/lib/api-response";
import { requireAuth } from "@/lib/auth/require-auth";
import { handleChatRouteError } from "@/lib/messages/api-handler";
import { listSupportTickets, createSupportTicket } from "@/lib/messages/support";

export async function GET(req: Request) {
  try {
    const { user, error } = await requireAuth();
    if (error) return error;
    const url = new URL(req.url);
    const isAdmin = user!.role === UserRole.ADMIN;
    const data = await listSupportTickets({
      userId: user!.id,
      isAdmin,
      q: url.searchParams.get("q") ?? undefined,
      page: Number(url.searchParams.get("page") ?? "1"),
    });
    return apiSuccess(data);
  } catch (e) {
    return handleChatRouteError(e);
  }
}

export async function POST(req: Request) {
  try {
    const { user, error } = await requireAuth();
    if (error) return error;
    const body = await req.json();
    const ticket = await createSupportTicket({
      userId: user!.id,
      subject: body.subject,
      description: body.description,
      category: body.category,
      priority: body.priority,
    });
    return apiSuccess({ ticket }, 201);
  } catch (e) {
    return handleChatRouteError(e);
  }
}
