"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { MessageCircle, Send, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSupportChat } from "@/providers/support-chat-provider";
import { useCurrentUser } from "@/hooks/use-current-user";
import {
  fetchConversationMessages,
  openSupportConversation,
  sendConversationMessage,
  markConversationRead,
  initGuestChatSession,
  sendGuestMessage,
  type ApiChatMessage,
  type GuestMessage,
} from "@/lib/support/chat-api";
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

function mapGuestMessages(rows: GuestMessage[]): DisplayMessage[] {
  return rows.map((m) => ({
    id: m.id,
    content: m.content,
    isUser: m.role === "user",
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
  const [isGuest, setIsGuest] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const scrollBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const reloadAuthMessages = useCallback(
    async (convId: string, userId: string, authToken: string) => {
      const rows = await fetchConversationMessages(authToken, convId);
      setMessages(mapApiMessages(rows, userId));
      await markConversationRead(authToken, convId);
    },
    []
  );

  useEffect(() => {
    if (!isOpen) return;

    async function init() {
      setLoading(true);
      setError(null);
      try {
        if (token && user) {
          const conv = await openSupportConversation(token);
          setConversationId(conv.id);
          setIsGuest(false);
          await reloadAuthMessages(conv.id, user.id, token);
        } else {
          const session = await initGuestChatSession();
          setIsGuest(true);
          setConversationId(null);
          setMessages(mapGuestMessages(session.messages));
        }
      } catch {
        setError("Não foi possível carregar o chat. Tente novamente em instantes.");
      } finally {
        setLoading(false);
        setTimeout(scrollBottom, 100);
      }
    }

    init();
  }, [isOpen, token, user, scrollBottom, reloadAuthMessages]);

  useEffect(() => {
    scrollBottom();
  }, [messages, scrollBottom]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const text = draft.trim();
    if (!text || sending) return;

    setSending(true);
    setDraft("");
    setError(null);

    try {
      if (isGuest || !token || !user) {
        setMessages((prev) => [
          ...prev,
          { id: `local-${Date.now()}`, content: text, isUser: true, createdAt: new Date().toISOString() },
        ]);
        const { assistantMessage } = await sendGuestMessage(text);
        setMessages((prev) => [
          ...prev,
          {
            id: assistantMessage.id,
            content: assistantMessage.content,
            isUser: false,
            createdAt: assistantMessage.createdAt,
          },
        ]);
        if (!isOpen) notifyNew();
      } else if (conversationId) {
        await sendConversationMessage(token, conversationId, text, true);
        await reloadAuthMessages(conversationId, user.id, token);
      }
    } catch {
      setError("Falha ao enviar mensagem. Verifique sua conexão e tente novamente.");
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
            <p className="text-[10px] text-white/70">
              {isGuest ? "Visitante · IA e suporte básico" : "Online · resposta em breve"}
            </p>
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

        {isGuest && (
          <p className="border-t px-3 py-2 text-center text-[10px] text-ecopet-gray leading-snug">
            Você pode tirar dúvidas antes de criar conta. Para salvar seu histórico e acessar recursos completos,{" "}
            <Link href="/login" className="text-ecopet-green underline">
              entre
            </Link>{" "}
            ou{" "}
            <Link href="/cadastro" className="text-ecopet-green underline">
              cadastre-se
            </Link>
            .
          </p>
        )}

        {error && (
          <p className="border-t px-3 py-2 text-center text-[11px] text-red-600" role="alert">
            {error}
          </p>
        )}

        <form onSubmit={handleSend} className="flex gap-2 border-t p-3">
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Digite sua mensagem..."
            className="flex-1"
            aria-label="Mensagem de suporte"
            disabled={loading}
          />
          <Button type="submit" size="icon" disabled={sending || loading || !draft.trim()} aria-label="Enviar mensagem">
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
