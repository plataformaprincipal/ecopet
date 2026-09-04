"use client";

import { isTalkJsConfigured } from "@/lib/talkjs/client";
import { isNativeMarketplaceChatEnabled } from "@/lib/commerce-chat/flag";
import { TalkJSMessagesHub } from "@/components/messages/TalkJSMessagesHub";
import { MessagesHub } from "@/components/features/messages/messages-hub";

export function MessagesPageContent({ initialConversationId }: { initialConversationId?: string }) {
  if (isNativeMarketplaceChatEnabled() || !isTalkJsConfigured()) {
    return <MessagesHub initialConversationId={initialConversationId} />;
  }
  return <TalkJSMessagesHub initialConversationId={initialConversationId} />;
}
