"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { MessageCircle, Send, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSupportChat } from "@/providers/support-chat-provider";
import { useCurrentUser } from "@/hooks/use-current-user";
import {
  fetchConversationMessages,
  openSupportConversation,
  sendConversationMessage,
  type ApiChatMessage,
} from "@/lib/support/chat-api";
import {
  getMockSupportMessages,
  sendMockSupportMessage,
  type SupportChatMessage,
} from "@/lib/support/mock-chat-store";
import { cn } from "@/lib/utils";

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

type DisplayMessage = {
  id: string;
  content: string;
  isUser: boolean;
  createdAt: string;
};

function mapApiMessages(rows: ApiChatMessage[], userId: string): DisplayMessage[] {
  return rows.map((m) => ({
    id: m.id,
    content: m.content,
    isUser: m.sender.id === userId,
    createdAt: m.createdAt,
  }));
}

function mapMockMessages(rows: SupportChatMessage[]): DisplayMessage[] {
  return rows.map((m) => ({
    id: m.id,
    content: m.content,
    isUser: m.sender === "user",
    createdAt: m.createdAt,
  }));
}

export function SupportChatPanel() {
  const { isOpen, closeChat, notifyNew } = useSupportChat();
  const { user, token } = useCurrentUser();
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [useMock, setUseMock] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const scrollBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    async function init() {
      setLoading(true);
      try {
        if (token && user) {
          const conv = await openSupportConversation(token);
          setConversationId(conv.id);
          const rows = await fetchConversationMessages(token, conv.id);
          setMessages(mapApiMessages(rows, user.id));
          setUseMock(false);
        } else {
          setMessages(mapMockMessages(getMockSupportMessages()));
          setUseMock(true);
        }
      } catch {
        setMessages(mapMockMessages(getMockSupportMessages()));
        setUseMock(true);
      } finally {
        setLoading(false);
        setTimeout(scrollBottom, 100);
      }
    }

    init();
  }, [isOpen, token, user, scrollBottom]);

  useEffect(() => {
    scrollBottom();
  }, [messages, scrollBottom]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const text = draft.trim();
    if (!text || sending) return;

    setSending(true);
    setDraft("");

    try {
      if (useMock || !token || !conversationId || !user) {
        const updated = sendMockSupportMessage(text);
        setMessages(mapMockMessages(updated));
        if (!isOpen) notifyNew();
      } else {
        const msg = await sendConversationMessage(token, conversationId, text);
        setMessages((prev) => [
          ...prev,
          { id: msg.id, content: msg.content, isUser: true, createdAt: msg.createdAt },
        ]);
      }
    } catch {
      const updated = sendMockSupportMessage(text);
      setMessages(mapMockMessages(updated));
      setUseMock(true);
    } finally {
      setSending(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div
      className="fixed bottom-[calc(4.5rem+env(safe-area-inset-bottom))] right-4 z-[60] flex w-[min(100vw-2rem,380px)] flex-col overflow-hidden rounded-2xl border border-ecopet-gray/15 bg-white shadow-2xl dark:border-white/10 dark:bg-ecopet-dark-card lg:bottom-6"
      role="dialog"
      aria-label="Chat de suporte ECOPET"
    >
      <header className="flex items-center justify-between bg-ecopet-dark px-4 py-3 text-white">
        <div className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5 text-ecopet-yellow" />
          <div>
            <p className="font-semibold text-sm">Suporte ECOPET</p>
            <p className="text-[10px] text-white/70">Online · resposta em breve</p>
          </div>
        </div>
        <Button type="button" size="icon" variant="ghost" className="text-white hover:bg-white/10" onClick={closeChat} aria-label="Fechar chat">
          <X className="h-5 w-5" />
        </Button>
      </header>

      <div className="flex max-h-[min(50vh,360px)] min-h-[240px] flex-1 flex-col">
        <div className="flex-1 space-y-3 overflow-y-auto p-4">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-ecopet-green" />
            </div>
          ) : (
            messages.map((m) => (
              <div key={m.id} className={cn("flex flex-col max-w-[85%]", m.isUser ? "ml-auto items-end" : "items-start")}>
                <div
                  className={cn(
                    "rounded-2xl px-3 py-2 text-sm",
                    m.isUser
                      ? "bg-ecopet-green text-white rounded-br-md"
                      : "bg-ecopet-gray/10 text-ecopet-dark dark:bg-white/10 dark:text-white rounded-bl-md"
                  )}
                >
                  {m.content}
                </div>
                <time className="mt-1 text-[10px] text-ecopet-gray">{formatTime(m.createdAt)}</time>
              </div>
            ))
          )}
          <div ref={bottomRef} />
        </div>

        {useMock && (
          <p className="border-t px-3 py-1 text-center text-[10px] text-ecopet-gray">
            Modo demonstração — histórico salvo localmente até login completo.
          </p>
        )}

        <form onSubmit={handleSend} className="flex gap-2 border-t p-3">
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Digite sua mensagem..."
            className="flex-1"
            aria-label="Mensagem de suporte"
          />
          <Button type="submit" size="icon" disabled={sending || !draft.trim()} aria-label="Enviar mensagem">
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </form>
      </div>
    </div>
  );
}

export function SupportChatLauncher() {
  const { isOpen, hasUnread, openChat } = useSupportChat();
  if (isOpen) return null;

  return (
    <button
      type="button"
      onClick={openChat}
      className="fixed bottom-[calc(4.5rem+env(safe-area-inset-bottom))] right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-ecopet-green text-white shadow-lg transition hover:scale-105 lg:bottom-6"
      aria-label="Abrir suporte ECOPET"
    >
      <MessageCircle className="h-6 w-6" />
      {hasUnread && (
        <span className="absolute right-1 top-1 h-3 w-3 rounded-full bg-red-500 ring-2 ring-white" aria-hidden />
      )}
    </button>
  );
}
