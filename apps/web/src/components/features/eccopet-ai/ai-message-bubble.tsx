"use client";

import Link from "next/link";
import { Sparkles, ArrowUpRight, Loader2, RotateCcw } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/providers/i18n-provider";
import { AIFeedbackButtons } from "@/components/features/ai/ai-feedback-buttons";
import type { AIMessage } from "./types";

/** Lightweight markdown: paragraphs, **bold**, and "- " bullet lists. */
function renderRich(content: string) {
  const lines = content.split("\n");
  const blocks: React.ReactNode[] = [];
  let list: string[] = [];

  const flushList = (key: string) => {
    if (list.length === 0) return;
    blocks.push(
      <ul key={key} className="my-1.5 list-disc space-y-0.5 pl-5">
        {list.map((item, i) => (
          <li key={i}>{renderInline(item)}</li>
        ))}
      </ul>
    );
    list = [];
  };

  lines.forEach((line, idx) => {
    const trimmed = line.trim();
    if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      list.push(trimmed.slice(2));
      return;
    }
    flushList(`list-${idx}`);
    if (trimmed.length > 0) {
      blocks.push(
        <p key={`p-${idx}`} className="whitespace-pre-wrap">
          {renderInline(trimmed)}
        </p>
      );
    }
  });
  flushList("list-end");
  return blocks;
}

function renderInline(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    return <span key={i}>{part}</span>;
  });
}

export function AIMessageBubble({
  message,
  conversationId,
  showRegenerate,
  onRegenerate,
}: {
  message: AIMessage;
  conversationId?: string;
  showRegenerate?: boolean;
  onRegenerate?: () => void;
}) {
  const { t } = useTranslation();
  const isUser = message.role === "user";

  return (
    <div className={cn("flex w-full gap-3", isUser ? "flex-row-reverse" : "flex-row")}>
      {isUser ? (
        <Avatar className="h-8 w-8 shrink-0">
          <AvatarFallback className="bg-ecopet-green text-white">EU</AvatarFallback>
        </Avatar>
      ) : (
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-ecopet-green to-emerald-600 text-white">
          <Sparkles className="h-4 w-4" aria-hidden />
        </span>
      )}

      <div className={cn("max-w-[85%] space-y-2", isUser ? "items-end" : "items-start")}>
        <div
          className={cn(
            "rounded-3xl px-4 py-3 text-sm leading-relaxed shadow-sm",
            isUser
              ? "rounded-tr-md bg-ecopet-green text-white"
              : "rounded-tl-md border border-zinc-200/70 bg-white text-zinc-800 dark:border-white/10 dark:bg-zinc-900/70 dark:text-zinc-100"
          )}
        >
          {message.pending ? (
            <span className="flex items-center gap-2 text-zinc-400">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              {t("ecopetAi.thinking")}
            </span>
          ) : (
            <div className="space-y-1.5">{renderRich(message.content)}</div>
          )}
        </div>

        {message.recommendations && message.recommendations.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {message.recommendations.map((rec) => (
              <Link
                key={rec.href + rec.label}
                href={rec.href}
                className="inline-flex items-center gap-1 rounded-xl border border-ecopet-green/30 bg-ecopet-green/5 px-3 py-1.5 text-xs font-medium text-ecopet-green transition hover:bg-ecopet-green/10"
              >
                {rec.label}
                <ArrowUpRight className="h-3 w-3" aria-hidden />
              </Link>
            ))}
          </div>
        ) : null}

        {!isUser && !message.pending && message.content ? (
          <div className="flex flex-wrap items-center gap-2">
            <AIFeedbackButtons
              conversationId={conversationId}
              messageId={message.id}
              contentToCopy={message.content}
            />
            {showRegenerate && onRegenerate ? (
              <button
                type="button"
                onClick={onRegenerate}
                aria-label={t("ecopetAi.regenerate")}
                className="inline-flex items-center gap-1 rounded p-1 text-xs text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-800"
              >
                <RotateCcw className="h-3.5 w-3.5" aria-hidden />
                {t("ecopetAi.regenerate")}
              </button>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
