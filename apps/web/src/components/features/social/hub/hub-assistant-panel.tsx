"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Send, Sparkles, ChevronRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { useAssistantStore } from "@/store/assistant-store";
import { useTranslation } from "@/providers/i18n-provider";

type ChatTurn = { role: "user" | "assistant"; content: string };

export function HubAssistantPanel({ className }: { className?: string }) {
  const { t } = useTranslation();
  const SUGGESTIONS = [
    t("social.assistant.s1"),
    t("social.assistant.s2"),
    t("social.assistant.s3"),
    t("social.assistant.s4"),
  ];
  const DEMO_REPLY = t("social.assistant.demoReply");
  const [messages, setMessages] = useState<ChatTurn[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const pendingPrompt = useAssistantStore((s) => s.pendingPrompt);
  const consumePrompt = useAssistantStore((s) => s.consumePrompt);

  const send = useCallback(
    async (raw?: string) => {
      const text = (raw ?? input).trim();
      if (!text || loading) return;
      setInput("");
      setMessages((m) => [...m, { role: "user", content: text }]);
      setLoading(true);
      try {
        const res = await api<{
          success?: boolean;
          data?: { reply?: string; content?: string };
          reply?: string;
          content?: string;
        }>("/api/ai/chat", {
          method: "POST",
          body: JSON.stringify({ message: text, type: "general" }),
        });
        const content = res.data?.content ?? res.data?.reply ?? res.content ?? res.reply ?? DEMO_REPLY;
        setMessages((m) => [...m, { role: "assistant", content }]);
      } catch {
        setMessages((m) => [...m, { role: "assistant", content: DEMO_REPLY }]);
      } finally {
        setLoading(false);
      }
    },
    [input, loading, DEMO_REPLY]
  );

  useEffect(() => {
    if (pendingPrompt) {
      const prompt = consumePrompt();
      if (prompt) void send(prompt);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingPrompt]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  return (
    <section
      className={cn(
        "flex h-[420px] flex-col overflow-hidden rounded-[20px] border border-zinc-200/80 bg-white shadow-sm dark:border-white/10 dark:bg-zinc-900/60",
        className
      )}
      aria-label="EccoPet Assistant"
    >
      <header className="flex items-center justify-between gap-2 border-b border-zinc-100 bg-gradient-to-r from-ecopet-green/10 to-ecopet-yellow/10 px-4 py-3 dark:border-white/5">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-ecopet-green/15">
            <Sparkles className="h-4 w-4 text-ecopet-green" aria-hidden />
          </span>
          <div>
            <p className="text-sm font-semibold text-zinc-900 dark:text-white">{t("social.assistant.title")}</p>
            <p className="text-[11px] text-zinc-500">{t("social.assistant.subtitle")}</p>
          </div>
        </div>
        <Link href="/eccopet" className="text-ecopet-green" aria-label={t("social.assistant.openFull")}>
          <ChevronRight className="h-5 w-5" aria-hidden />
        </Link>
      </header>

      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-4" aria-live="polite">
        {messages.length === 0 ? (
          <div className="space-y-3">
            <p className="text-sm text-zinc-500">
              {t("social.assistant.greeting")}
            </p>
            <div className="flex flex-col gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => void send(s)}
                  className="rounded-xl border border-zinc-200/80 bg-zinc-50 px-3 py-2 text-left text-xs text-zinc-600 transition hover:border-ecopet-green/40 hover:text-ecopet-green dark:border-white/10 dark:bg-white/5 dark:text-zinc-300"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((m, i) => (
            <div
              key={i}
              className={cn(
                "max-w-[90%] rounded-2xl px-3 py-2 text-sm",
                m.role === "user"
                  ? "ml-auto bg-ecopet-green text-white"
                  : "mr-auto border border-zinc-100 bg-zinc-50 text-zinc-800 dark:border-white/5 dark:bg-white/5 dark:text-zinc-100"
              )}
            >
              {m.content}
            </div>
          ))
        )}
        {loading ? (
          <div className="mr-auto flex items-center gap-2 rounded-2xl bg-zinc-50 px-3 py-2 text-sm text-zinc-500 dark:bg-white/5">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            {t("social.assistant.thinking")}
          </div>
        ) : null}
      </div>

      <div className="border-t border-zinc-100 p-3 dark:border-white/5">
        <div className="flex gap-2">
          <label className="sr-only" htmlFor="hub-assistant-input">
            {t("social.assistant.title")}
          </label>
          <input
            id="hub-assistant-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && void send()}
            placeholder={t("social.assistant.placeholder")}
            className="flex-1 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm focus:border-ecopet-green focus:outline-none dark:border-white/10 dark:bg-zinc-950"
          />
          <Button size="icon" className="rounded-xl" onClick={() => void send()} disabled={loading || !input.trim()}>
            <Send className="h-4 w-4" aria-hidden />
          </Button>
        </div>
      </div>
    </section>
  );
}
