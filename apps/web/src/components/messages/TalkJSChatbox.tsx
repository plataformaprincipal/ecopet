"use client";

import { Chatbox } from "@talkjs/react";
import { useTranslation } from "@/providers/i18n-provider";

type TalkJSChatboxProps = {
  conversationId: string | null;
  className?: string;
};

export function TalkJSChatbox({ conversationId, className }: TalkJSChatboxProps) {
  const { t } = useTranslation();

  if (!conversationId) {
    return (
      <div className="flex flex-1 items-center justify-center p-6 text-sm text-muted-foreground" role="status">
        {t("messagesModule.selectConversation")}
      </div>
    );
  }

  return (
    <Chatbox
      conversationId={conversationId}
      className={className}
      style={{ width: "100%", height: "100%" }}
      loadingComponent={
        <p className="p-4 text-sm text-muted-foreground" role="status">
          {t("messagesModule.loading")}
        </p>
      }
    />
  );
}
