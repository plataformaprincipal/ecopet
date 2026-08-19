"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { MessageCircle, Send, X, Loader2, LifeBuoy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSupportChat } from "@/providers/support-chat-provider";
import { useCurrentUser } from "@/hooks/use-current-user";
import {
  bootstrapSupportChat,
  sendSupportChatMessage,
  type SupportDisplayMessage,
} from "@/lib/support/platform-support-client";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/providers/i18n-provider";

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const SUGGESTIONS = [
  { id: "cadastro", category: "ACCOUNT", prompt: "Estou com problema no cadastro" },
  { id: "pagamento", category: "PAYMENT", prompt: "Problema com pagamento" },
  { id: "parceiro", category: "PARTNER", prompt: "Sou parceiro e preciso de ajuda" },
  { id: "ong", category: "ONG", prompt: "Sou ONG e preciso de ajuda" },
  { id: "pedido", category: "ORDER", prompt: "Problema com meu pedido" },
  { id: "servico", category: "OTHER", prompt: "Problema com serviço/agendamento" },
  { id: "tecnico", category: "TECHNICAL", prompt: "Problema técnico na plataforma" },
] as const;

export function SupportChatPanel() {
  const { isOpen, closeChat, notifyNew } = useSupportChat();
  const { user, token } = useCurrentUser();
  const { t } = useTranslation();
  const [messages, setMessages] = useState<SupportDisplayMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [escalateSuggested, setEscalateSuggested] = useState(false);
  const [protocol, setProtocol] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const authenticated = Boolean(token && user);

  const scrollBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const startNewConversation = useCallback(async () => {
    setLoading(true);
    setError(null);
    setEscalateSuggested(false);
    setProtocol(null);
    try {
      const session = await bootstrapSupportChat(authenticated);
      setMessages(
        (session.messages || []).map((m) => ({
          id: m.id,
          content: m.content,
          isUser: m.role === "user",
          createdAt: m.createdAt,
        }))
      );
    } catch {
      setMessages([
        {
          id: "welcome-local",
          content: t("support.welcome"),
          isUser: false,
          createdAt: new Date().toISOString(),
        },
      ]);
      setError(t("support.loadError"));
    } finally {
      setLoading(false);
      setTimeout(scrollBottom, 80);
    }
  }, [authenticated, scrollBottom, t]);

  useEffect(() => {
    if (!isOpen) return;
    void startNewConversation();
  }, [isOpen, startNewConversation]);

  useEffect(() => {
    scrollBottom();
  }, [messages, scrollBottom]);

  async function sendText(text: string, category?: string, escalate?: boolean) {
    if (!text || sending) return;
    setSending(true);
    setError(null);
    setMessages((prev) => [
      ...prev,
      { id: `local-${Date.now()}`, content: text, isUser: true, createdAt: new Date().toISOString() },
    ]);
    try {
      const result = await sendSupportChatMessage({
        message: text,
        authenticated,
        escalate,
        category,
      });
      setMessages((prev) => [
        ...prev,
        {
          id: result.correlationId,
          content: result.reply,
          isUser: false,
          createdAt: new Date().toISOString(),
        },
      ]);
      setEscalateSuggested(Boolean(result.escalateSuggested));
      if (result.protocol) setProtocol(result.protocol);
      if (!isOpen) notifyNew();
    } catch {
      setError(t("support.sendError"));
      setEscalateSuggested(true);
    } finally {
      setSending(false);
    }
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const text = draft.trim();
    if (!text) return;
    setDraft("");
    await sendText(text);
  }

  if (!isOpen) return null;

  return (
    <div
      className="ep-float-support-panel flex flex-col overflow-hidden rounded-2xl border border-ecopet-gray/15 bg-[var(--ep-bg-elevated)] shadow-2xl"
      role="dialog"
      aria-modal="true"
      aria-label={t("support.title")}
    >
      <header className="flex items-center justify-between bg-ecopet-dark px-4 py-3 text-white">
        <div className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5 text-ecopet-yellow" aria-hidden />
          <div>
            <p className="text-sm font-semibold">{t("support.title")}</p>
            <p className="text-[10px] text-white/70">{t("support.subtitle")}</p>
            <p className="text-[10px] text-white/55">
              {authenticated ? t("support.statusAuth") : t("support.statusGuest")}
            </p>
          </div>
        </div>
        <div className="flex gap-1">
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="text-white hover:bg-white/10"
            onClick={() => void startNewConversation()}
            aria-label={t("support.newConversation")}
          >
            <LifeBuoy className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="text-white hover:bg-white/10"
            onClick={closeChat}
            aria-label={t("support.close")}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
      </header>

      <div className="flex max-h-[min(55vh,420px)] min-h-[260px] flex-1 flex-col">
        <div className="flex-1 space-y-3 overflow-y-auto p-4">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-ecopet-green" aria-hidden />
              <span className="sr-only">{t("support.thinking")}</span>
            </div>
          ) : (
            <>
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={cn("flex max-w-[85%] flex-col", m.isUser ? "ml-auto items-end" : "items-start")}
                >
                  <div
                    className={cn(
                      "rounded-2xl px-3 py-2 text-sm",
                      m.isUser
                        ? "rounded-br-md bg-ecopet-green text-white"
                        : "rounded-bl-md bg-ecopet-gray/10 text-ecopet-dark dark:bg-white/10 dark:text-white"
                    )}
                  >
                    {m.content}
                  </div>
                  <time className="mt-1 text-[10px] text-ecopet-gray">{formatTime(m.createdAt)}</time>
                </div>
              ))}
              {messages.length <= 2 && (
                <div className="flex flex-wrap gap-2 pt-1" role="group" aria-label={t("support.suggestionsLabel")}>
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      className="rounded-full border border-ecopet-green/30 bg-white px-3 py-1.5 text-left text-xs text-ecopet-dark hover:bg-ecopet-green/10 dark:border-white/20 dark:bg-transparent dark:text-white"
                      onClick={() => void sendText(s.prompt, s.category)}
                      disabled={sending}
                    >
                      {t(`support.suggestions.${s.id}` as never)}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
          {sending && (
            <p className="text-xs text-ecopet-gray" role="status" aria-live="polite">
              {t("support.thinking")}
            </p>
          )}
          <div ref={bottomRef} />
        </div>

        {(escalateSuggested || protocol) && (
          <div className="space-y-2 border-t px-3 py-2">
            {protocol ? (
              <p className="text-center text-[11px] text-ecopet-green" role="status">
                {t("support.protocol", { protocol })}
              </p>
            ) : (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full"
                disabled={sending}
                onClick={() => void sendText(t("support.escalatePrompt"), "OTHER", true)}
              >
                {t("support.escalate")}
              </Button>
            )}
          </div>
        )}

        {!authenticated && (
          <p className="border-t px-3 py-2 text-center text-[10px] leading-snug text-ecopet-gray">
            {t("support.guestHint")}{" "}
            <Link href="/login" className="text-ecopet-green underline">
              {t("common.signInLink")}
            </Link>{" "}
            /{" "}
            <Link href="/cadastro" className="text-ecopet-green underline">
              {t("common.registerLink")}
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
            placeholder={t("support.placeholder")}
            className="flex-1"
            aria-label={t("support.placeholder")}
            disabled={loading || sending}
          />
          <Button
            type="submit"
            size="icon"
            disabled={sending || loading || !draft.trim()}
            aria-label={t("support.send")}
          >
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </form>
      </div>
    </div>
  );
}

export function SupportChatLauncher() {
  const { isOpen, hasUnread, openChat } = useSupportChat();
  const { t } = useTranslation();
  if (isOpen) return null;

  return (
    <button
      type="button"
      onClick={openChat}
      className="fixed bottom-[calc(4.5rem+env(safe-area-inset-bottom))] left-4 z-[55] flex h-12 w-12 items-center justify-center rounded-full bg-ecopet-green text-white shadow-lg transition hover:scale-105 lg:bottom-6"
      aria-label={t("support.open")}
    >
      <MessageCircle className="h-5 w-5" />
      {hasUnread && (
        <span className="absolute right-1 top-1 h-3 w-3 rounded-full bg-red-500 ring-2 ring-white" aria-hidden />
      )}
    </button>
  );
}
