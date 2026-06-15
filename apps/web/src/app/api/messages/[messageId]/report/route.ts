import { apiSuccess } from "@/lib/api-response";
import { requireAuth } from "@/lib/auth/require-auth";
import { handleChatRouteError } from "@/lib/messages/api-handler";
import { reportMessage } from "@/lib/messages/messages";

type Params = { params: Promise<{ messageId: string }> };

export async function POST(req: Request, { params }: Params) {
  try {
    const { user, error } = await requireAuth();
    if (error) return error;
    const { messageId } = await params;
    const body = await req.json();
    const report = await reportMessage({
      messageId,
      reporterId: user!.id,
      reason: body.reason,
      description: body.description,
    });
    return apiSuccess({ report }, 201);
  } catch (e) {
    return handleChatRouteError(e);
  }
}
