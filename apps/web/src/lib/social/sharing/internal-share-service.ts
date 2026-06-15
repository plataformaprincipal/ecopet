import { sendMessage } from "@/lib/messages/messages";
import { buildPostShareLink } from "@/lib/social/utils";

export async function sharePostToConversation(params: {
  conversationId: string;
  senderId: string;
  postId: string;
  message?: string;
}) {
  const link = buildPostShareLink(params.postId);
  const content = params.message?.trim()
    ? `${params.message.trim()}\n\nPublicacao: ${link}`
    : `Compartilhou uma publicacao: ${link}`;

  const result = await sendMessage({
    conversationId: params.conversationId,
    senderId: params.senderId,
    content,
    type: "TEXT",
    attachments: undefined,
  });

  return result.id;
}
