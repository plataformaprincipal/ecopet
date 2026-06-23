"use client";

import { Inbox } from "@talkjs/react";
import { useTranslation } from "@/providers/i18n-provider";

type TalkJSInboxProps = {
  onSelectConversation: (talkjsConversationId: string) => void;
  className?: string;
};

export function TalkJSInbox({ onSelectConversation, className }: TalkJSInboxProps) {
  const { t } = useTranslation();

  return (
    <Inbox
      className={className}
      style={{ width: "100%", height: "100%" }}
      onSelectConversation={(event) => {
        onSelectConversation(event.conversation.id);
      }}
      loadingComponent={
        <p className="p-4 text-sm text-muted-foreground" role="status">
          {t("messagesModule.loading")}
        </p>
      }
    />
  );
}
