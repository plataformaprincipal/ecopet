"use client";

import { useFoundationSession } from "@/hooks/use-foundation-session";
import type { ChatMessage, CommerceQuote } from "@/lib/messages/client-api";
import { MessageBubble } from "@/components/features/messages/message-bubble";
import { CommerceQuoteCard } from "@/components/features/commerce/commerce-quote-card";

export function MessageList({
  messages,
  quotes = [],
  isClient,
  quoteBusy,
  onAcceptQuote,
  onRejectQuote,
  loading,
  onReport,
  onBlock,
}: {
  messages: ChatMessage[];
  quotes?: CommerceQuote[];
  isClient?: boolean;
  quoteBusy?: string;
  onAcceptQuote?: (id: string) => void;
  onRejectQuote?: (id: string) => void;
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
    <div className="flex-1 space-y-2.5 overflow-y-auto px-3 py-4 sm:px-4">
      {messages.map((m) => {
        const quoteId =
          m.type === "QUOTE" && m.metadata && typeof m.metadata.quoteId === "string"
            ? m.metadata.quoteId
            : null;
        const quote = quoteId ? quotes.find((q) => q.id === quoteId) : null;
        if (quote) {
          return (
            <CommerceQuoteCard
              key={m.id}
              quote={quote}
              isClient={isClient}
              busy={quoteBusy === quote.id}
              onAccept={() => onAcceptQuote?.(quote.id)}
              onReject={() => onRejectQuote?.(quote.id)}
            />
          );
        }
        return (
          <MessageBubble
            key={m.id}
            message={m}
            isMine={m.senderId === user?.id || m.senderId === "me"}
            onReport={() => onReport(m.id)}
            onBlock={() => onBlock(m.senderId)}
          />
        );
      })}
    </div>
  );
}
