"use client";

import { AlertCircle } from "lucide-react";
import { isTalkJsConfigured } from "@/lib/talkjs/client";
import { TalkJSMessagesHub } from "@/components/messages/TalkJSMessagesHub";

const TALKJS_UNAVAILABLE_MESSAGE =
  "O serviço de mensagens ainda não está configurado neste ambiente.";

export function MessagesPageContent({ initialConversationId }: { initialConversationId?: string }) {
  if (!isTalkJsConfigured()) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2 p-8 text-center text-sm text-muted-foreground">
        <AlertCircle className="h-8 w-8 text-amber-500" aria-hidden />
        <p>{TALKJS_UNAVAILABLE_MESSAGE}</p>
      </div>
    );
  }

  return <TalkJSMessagesHub initialConversationId={initialConversationId} />;
}
