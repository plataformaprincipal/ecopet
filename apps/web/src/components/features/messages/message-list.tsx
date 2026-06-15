"use client";

import { useFoundationSession } from "@/hooks/use-foundation-session";
import type { ChatMessage } from "@/lib/messages/client-api";
import { MessageBubble } from "@/components/features/messages/message-bubble";

export function MessageList({
  messages,
  loading,
  onReport,
  onBlock,
}: {
  messages: ChatMessage[];
  loading?: boolean;
  onReport: (messageId: string) => void;
  onBlock: (userId: string) => void;
}) {
  const { user } = useFoundationSession();
  if (loading && messages.length === 0) {
    return <p className="flex-1 p-4 text-sm text-muted-foreground">Carregando mensagens...</p>;
  }
  if (!loading && messages.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center p-6 text-sm text-muted-foreground">
        Nenhuma mensagem ainda. Envie a primeira!
      </div>
    );
  }
  return (
    <div className="flex-1 space-y-3 overflow-y-auto p-4">
      {messages.map((m) => (
        <MessageBubble
          key={m.id}
          message={m}
          isMine={m.senderId === user?.id || m.senderId === "me"}
          onReport={() => onReport(m.id)}
          onBlock={() => onBlock(m.senderId)}
        />
      ))}
    </div>
  );
}
