"use client";

import { isTalkJsConfigured } from "@/lib/talkjs/client";
import { MessagesHub } from "@/components/features/messages/messages-hub";
import { TalkJSMessagesHub } from "@/components/messages/TalkJSMessagesHub";

export function MessagesPageContent({ initialConversationId }: { initialConversationId?: string }) {
  if (isTalkJsConfigured()) {
    return <TalkJSMessagesHub initialConversationId={initialConversationId} />;
  }
  return <MessagesHub initialConversationId={initialConversationId} />;
}
