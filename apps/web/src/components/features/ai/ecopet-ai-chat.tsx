"use client";

import { useEffect, useRef, useState } from "react";
import { EcoPetAIButton } from "@/components/features/ai/ecopet-ai-button";
import { AIPrivacyNotice } from "@/components/features/ai/ai-privacy-notice";
import { AIFeedbackButtons } from "@/components/features/ai/ai-feedback-buttons";
import { AIErrorState } from "@/components/features/ai/ai-error-state";
import {
  AiUnavailableBanner,
  isAiNotConfiguredErrorCode,
} from "@/components/features/ai/ai-unavailable-banner";

type Message = { id: string; role: "user" | "assistant"; content: string };

type Props = {
  locale?: string;
  petId?: string;
  conversationId?: string;
  onConversationId?: (id: string) => void;
};

export function EcoPetAIChat({ locale = "pt-BR", petId, conversationId, onConversationId }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unavailable, setUnavailable] = useState(false);
  const [unavailableMessage, setUnavailableMessage] = useState<string | null>(null);
  const [convId, setConvId] = useState(conversationId);
  const abortRef = useRef<AbortController | null>(null);
  const liveRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    liveRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, loading]);

  async function send() {
    const text = input.trim();
    if (!text || unavailable) return;
    setError(null);
    setLoading(true);
    abortRef.current?.abort();
    abortRef.current = new AbortController();

    const userMsg: Message = { id: `u-${Date.now()}`, role: "user", content: text };
    setMessages((m) => [...m, userMsg]);
    setInput("");

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: abortRef.current.signal,
        body: JSON.stringify({
          message: text,
          locale,
          petId,
          conversationId: convId,
        }),
      });
      const json = await res.json().catch(() => ({}));
      const code = json?.error?.code as string | undefined;

      if (!res.ok || json?.success === false) {
        if (isAiNotConfiguredErrorCode(code)) {
          setUnavailable(true);
          setUnavailableMessage(
            json?.error?.message ||
              "Os recursos de inteligência artificial ainda não estão disponíveis neste ambiente."
          );
          // Remove a mensagem do usuário se a IA não está configurada (evita falso histórico)
          setMessages((m) => m.filter((msg) => msg.id !== userMsg.id));
          setInput(text);
          return;
        }
        throw new Error(json?.error?.message || json?.message || "Falha na IA");
      }

      const content = (json?.data?.content ?? json?.data?.reply ?? json?.reply ?? "").trim();
      if (!content) {
        throw new Error("Resposta vazia da IA.");
      }
      const newConv = json?.data?.conversationId as string | undefined;
      if (newConv) {
        setConvId(newConv);
        onConversationId?.(newConv);
      }
      setMessages((m) => [...m, { id: `a-${Date.now()}`, role: "assistant", content }]);
    } catch (e) {
      if ((e as Error).name === "AbortError") return;
      setError(e instanceof Error ? e.message : "Erro");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex h-full min-h-[420px] flex-col gap-3">
      <AIPrivacyNotice locale={locale} />
      {unavailable && (
        <AiUnavailableBanner message={unavailableMessage ?? undefined} />
      )}
      <div
        className="flex-1 space-y-3 overflow-y-auto rounded-2xl border border-zinc-200 bg-white/70 p-3 dark:border-zinc-800 dark:bg-zinc-950/50"
        aria-live="polite"
        aria-relevant="additions"
      >
        {messages.length === 0 && !loading && !unavailable && (
          <p className="text-sm text-zinc-500">Envie uma mensagem para começar.</p>
        )}
        {messages.map((m) => (
          <div
            key={m.id}
            className={
              m.role === "user"
                ? "ml-8 rounded-2xl bg-emerald-600 px-3 py-2 text-sm text-white"
                : "mr-8 rounded-2xl bg-zinc-100 px-3 py-2 text-sm text-zinc-900 dark:bg-zinc-900 dark:text-zinc-100"
            }
          >
            <div className="whitespace-pre-wrap break-words">{m.content}</div>
            {m.role === "assistant" && convId && (
              <AIFeedbackButtons conversationId={convId} messageId={m.id} />
            )}
          </div>
        ))}
        {loading && (
          <p className="text-sm text-zinc-500" role="status">
            Gerando resposta…
          </p>
        )}
        <div ref={liveRef} />
      </div>
      {error && !unavailable && <AIErrorState message={error} onRetry={() => void send()} />}
      <div className="flex gap-2">
        <label className="sr-only" htmlFor="ecopet-ai-input">
          Mensagem
        </label>
        <input
          id="ecopet-ai-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void send();
            }
          }}
          className="flex-1 rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 dark:border-zinc-700 dark:bg-zinc-950"
          placeholder={unavailable ? "IA indisponível neste ambiente" : "Pergunte à EcoPet AI…"}
          disabled={loading || unavailable}
        />
        {loading ? (
          <EcoPetAIButton
            onClick={() => abortRef.current?.abort()}
            label="Cancelar"
            className="rounded-xl bg-zinc-700 px-3 py-2 text-sm text-white"
          >
            Cancelar
          </EcoPetAIButton>
        ) : (
          <EcoPetAIButton onClick={() => void send()} disabled={!input.trim() || unavailable}>
            Enviar
          </EcoPetAIButton>
        )}
      </div>
    </div>
  );
}
