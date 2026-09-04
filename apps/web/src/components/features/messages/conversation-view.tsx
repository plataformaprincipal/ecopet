"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMessagesPolling } from "@/hooks/use-message-polling";
import { useFoundationSession } from "@/hooks/use-foundation-session";
import { MessageList } from "@/components/features/messages/message-list";
import { MessageComposer } from "@/components/features/messages/message-composer";
import { MessageReportModal } from "@/components/features/messages/message-report-modal";
import { PartnerQuoteComposer } from "@/components/features/commerce/partner-quote-composer";
import { CommerceQuoteCard } from "@/components/features/commerce/commerce-quote-card";
import { messagesApi, commerceQuotesApi, type CommerceQuote } from "@/lib/messages/client-api";

export function ConversationView({
  conversationId,
  onBack,
}: {
  conversationId: string;
  onBack: () => void;
}) {
  const router = useRouter();
  const { user } = useFoundationSession();
  const { messages, loading, error, refresh, setMessages } = useMessagesPolling(conversationId);
  const [pending, setPending] = useState(false);
  const [sendError, setSendError] = useState("");
  const [reportMessageId, setReportMessageId] = useState<string | null>(null);
  const [quotes, setQuotes] = useState<CommerceQuote[]>([]);
  const [isPartner, setIsPartner] = useState(false);
  const [quoteBusy, setQuoteBusy] = useState("");

  useEffect(() => {
    let cancelled = false;
    void messagesApi.getConversation(conversationId).then((data) => {
      if (cancelled) return;
      const me = data.conversation.participants.find((p) => p.id === user?.id);
      setIsPartner(me?.role === "PARTNER" || user?.role === "PARTNER");
    }).catch(() => undefined);
    void commerceQuotesApi.list(conversationId).then((data) => {
      if (!cancelled) setQuotes(data.quotes);
    }).catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [conversationId, user?.id, user?.role, messages.length]);

  async function handleSend(content: string, attachments?: Array<{
    fileName: string;
    fileUrl: string;
    mimeType: string;
    fileSize: number;
    storageProvider: string;
  }>) {
    setPending(true);
    setSendError("");
    const optimistic = {
      id: `tmp-${Date.now()}`,
      senderId: "me",
      sender: { id: "me", name: "Você", role: "CLIENT", avatarUrl: null },
      content: content || (attachments?.length ? "[Anexo]" : ""),
      type: attachments?.length ? "FILE" : "TEXT",
      isDeleted: false,
      isEdited: false,
      createdAt: new Date().toISOString(),
      attachments: attachments?.map((a, i) => ({
        id: `tmp-att-${i}`,
        url: a.fileUrl,
        fileName: a.fileName,
        mimeType: a.mimeType,
      })) ?? [],
    };
    setMessages((prev) => [...prev, optimistic]);
    try {
      const { message } = await messagesApi.sendMessage(conversationId, content, attachments);
      setMessages((prev) => [...prev.filter((m) => m.id !== optimistic.id), message]);
      void refresh();
    } catch (e) {
      setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
      setSendError(e instanceof Error ? e.message : "Falha ao enviar");
    } finally {
      setPending(false);
    }
  }

  async function acceptQuote(quoteId: string) {
    setQuoteBusy(quoteId);
    try {
      const result = await commerceQuotesApi.accept(quoteId, 0.01);
      router.push(result.checkoutHref || "/checkout");
    } catch (e) {
      setSendError(e instanceof Error ? e.message : "Falha ao aceitar");
    } finally {
      setQuoteBusy("");
    }
  }

  async function rejectQuote(quoteId: string) {
    setQuoteBusy(quoteId);
    try {
      await commerceQuotesApi.reject(quoteId);
      const data = await commerceQuotesApi.list(conversationId);
      setQuotes(data.quotes);
      void refresh();
    } catch (e) {
      setSendError(e instanceof Error ? e.message : "Falha ao recusar");
    } finally {
      setQuoteBusy("");
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-col" data-testid="native-conversation">
      <header className="flex items-center gap-2 border-b border-ecopet-gray/10 px-4 py-3 dark:border-white/10">
        <Button size="icon" variant="ghost" className="lg:hidden" onClick={onBack} aria-label="Voltar">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h2 className="font-semibold text-ecopet-dark dark:text-white">Conversa</h2>
          <p className="text-xs text-muted-foreground">Atualização automática a cada 5s</p>
        </div>
      </header>

      {error && <p className="px-4 py-2 text-sm text-red-600">{error}</p>}
      <MessageList
        messages={messages}
        quotes={quotes}
        isClient={!isPartner}
        quoteBusy={quoteBusy}
        onAcceptQuote={(id) => void acceptQuote(id)}
        onRejectQuote={(id) => void rejectQuote(id)}
        loading={loading}
        onReport={(id) => setReportMessageId(id)}
        onBlock={async (userId) => {
          await messagesApi.blockUser(userId);
        }}
      />

      {sendError && <p className="px-4 text-xs text-red-600">{sendError}</p>}
      {isPartner ? (
        <PartnerQuoteComposer
          conversationId={conversationId}
          onCreated={() => {
            void commerceQuotesApi.list(conversationId).then((d) => setQuotes(d.quotes));
            void refresh();
          }}
        />
      ) : null}
      <MessageComposer onSend={handleSend} disabled={pending} />

      <MessageReportModal
        messageId={reportMessageId}
        open={Boolean(reportMessageId)}
        onClose={() => setReportMessageId(null)}
      />
    </div>
  );
}
