"use client";

import { useState } from "react";
import { ArrowLeft, Flag, Ban } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMessagesPolling } from "@/hooks/use-message-polling";
import { MessageList } from "@/components/features/messages/message-list";
import { MessageComposer } from "@/components/features/messages/message-composer";
import { MessageReportModal } from "@/components/features/messages/message-report-modal";
import { messagesApi } from "@/lib/messages/client-api";

export function ConversationView({
  conversationId,
  onBack,
}: {
  conversationId: string;
  onBack: () => void;
}) {
  const { messages, loading, error, refresh, setMessages } = useMessagesPolling(conversationId);
  const [pending, setPending] = useState(false);
  const [sendError, setSendError] = useState("");
  const [reportMessageId, setReportMessageId] = useState<string | null>(null);

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

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="flex items-center gap-2 border-b px-4 py-3">
        <Button size="icon" variant="ghost" className="lg:hidden" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h2 className="font-semibold">Conversa</h2>
          <p className="text-xs text-muted-foreground">Atualização automática a cada 5s</p>
        </div>
      </header>

      {error && <p className="px-4 py-2 text-sm text-red-600">{error}</p>}
      <MessageList
        messages={messages}
        loading={loading}
        onReport={(id) => setReportMessageId(id)}
        onBlock={async (userId) => {
          await messagesApi.blockUser(userId);
        }}
      />

      {sendError && <p className="px-4 text-xs text-red-600">{sendError}</p>}
      <MessageComposer onSend={handleSend} disabled={pending} />

      <MessageReportModal
        messageId={reportMessageId}
        open={Boolean(reportMessageId)}
        onClose={() => setReportMessageId(null)}
      />
    </div>
  );
}
