import { apiSuccess } from "@/lib/api-response";
import { requireAuth } from "@/lib/auth/require-auth";
import { handleChatRouteError } from "@/lib/messages/api-handler";
import { listMessages, sendMessage } from "@/lib/messages/messages";
import { setParticipantFlag } from "@/lib/messages/conversations";

type Params = { params: Promise<{ conversationId: string }> };

export async function GET(req: Request, { params }: Params) {
  try {
    const { user, error } = await requireAuth();
    if (error) return error;
    const { conversationId } = await params;
    const url = new URL(req.url);
    const cursor = url.searchParams.get("cursor") ?? undefined;
    const limit = Number(url.searchParams.get("limit") ?? "20");
    const order = (url.searchParams.get("order") as "asc" | "desc") ?? "asc";

    const data = await listMessages({ conversationId, userId: user!.id, cursor, limit, order });
    return apiSuccess(data);
  } catch (e) {
    return handleChatRouteError(e);
  }
}

export async function POST(req: Request, { params }: Params) {
  try {
    const { user, error } = await requireAuth();
    if (error) return error;
    const { conversationId } = await params;
    const body = await req.json();

    const message = await sendMessage({
      conversationId,
      senderId: user!.id,
      content: body.content,
      type: body.type,
      attachments: body.attachments,
    });
    return apiSuccess({ message }, 201);
  } catch (e) {
    return handleChatRouteError(e);
  }
}
