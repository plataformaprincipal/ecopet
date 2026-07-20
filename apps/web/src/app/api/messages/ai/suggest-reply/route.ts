import { z } from "zod";
import { apiSuccess, apiFailure } from "@/lib/api-response";
import { requireAuth } from "@/lib/auth/require-auth";
import { requireActiveChatUser } from "@/lib/messages/permissions";
import { suggestMessageReplyDraft } from "@/lib/talkjs/ai-assist";
import { isMessagingFlagEnabled } from "@/lib/talkjs/config";

export const dynamic = "force-dynamic";

const schema = z.object({
  lastMessages: z.array(z.string().max(500)).max(8),
});

export async function POST(request: Request) {
  const { user, error } = await requireAuth();
  if (error || !user) return error!;

  if (!isMessagingFlagEnabled("ai_assist")) {
    return apiFailure("FLAG_DISABLED", "IA de mensagens desativada.", 503);
  }

  await requireActiveChatUser(user.id);

  const body = await request.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return apiFailure("VALIDATION", "Payload inválido.", 400);
  }

  const result = await suggestMessageReplyDraft({
    userId: user.id,
    role: user.role,
    lastMessages: parsed.data.lastMessages,
  });

  if (!result) {
    return apiFailure("AI_UNAVAILABLE", "Rascunho indisponível.", 503);
  }

  return apiSuccess(result);
}
