"use client";

import { useRef, useState } from "react";
import { Send, ImagePlus, Paperclip, Loader2, Square } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/providers/i18n-provider";

export function AIPromptBox({
  onSend,
  disabled,
  loading,
  onCancel,
  onAttachAttempt,
  placeholder,
}: {
  onSend: (text: string) => void;
  disabled?: boolean;
  loading?: boolean;
  onCancel?: () => void;
  /** Called when an attach button is used (prepared, not yet active). */
  onAttachAttempt?: () => void;
  placeholder?: string;
}) {
  const { t } = useTranslation();
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isLoading = Boolean(loading || disabled);

  function submit() {
    const text = value.trim();
    if (!text || isLoading) return;
    onSend(text);
    setValue("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
  }

  function handleInput(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setValue(e.target.value);
    const el = e.target;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }

  return (
    <div className="rounded-3xl border border-zinc-200/80 bg-white/90 p-2 shadow-lg backdrop-blur-md dark:border-white/10 dark:bg-zinc-900/70">
      <div className="flex items-end gap-2">
        <div className="flex gap-0.5 pb-1.5">
          <button
            type="button"
            onClick={onAttachAttempt}
            aria-label={t("ecopetAi.attachImage")}
            title={t("ecopetAi.attachImageTitle")}
            className="flex h-9 w-9 items-center justify-center rounded-xl text-zinc-400 transition hover:bg-zinc-100 hover:text-ecopet-green dark:hover:bg-white/5"
          >
            <ImagePlus className="h-5 w-5" aria-hidden />
          </button>
          <button
            type="button"
            onClick={onAttachAttempt}
            aria-label={t("ecopetAi.attachFile")}
            title={t("ecopetAi.attachFileTitle")}
            className="flex h-9 w-9 items-center justify-center rounded-xl text-zinc-400 transition hover:bg-zinc-100 hover:text-ecopet-green dark:hover:bg-white/5"
          >
            <Paperclip className="h-5 w-5" aria-hidden />
          </button>
        </div>

        <label htmlFor="ai-prompt-input" className="sr-only">
          {t("ecopetAi.promptPlaceholder")}
        </label>
        <textarea
          id="ai-prompt-input"
          ref={textareaRef}
          rows={1}
          value={value}
          onChange={handleInput}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              submit();
            }
          }}
          placeholder={placeholder ?? t("ecopetAi.promptPlaceholder")}
          disabled={isLoading}
          className="max-h-40 flex-1 resize-none bg-transparent py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none disabled:opacity-60 dark:text-white"
        />

        {loading && onCancel ? (
          <button
            type="button"
            onClick={onCancel}
            aria-label={t("ecopetAi.cancel")}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-zinc-700 text-white transition hover:bg-zinc-800 active:scale-95"
          >
            <Square className="h-4 w-4 fill-current" aria-hidden />
          </button>
        ) : (
          <button
            type="button"
            onClick={submit}
            disabled={isLoading || !value.trim()}
            aria-label={t("ecopetAi.send")}
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-white transition",
              isLoading || !value.trim()
                ? "cursor-not-allowed bg-zinc-300 dark:bg-zinc-700"
                : "bg-ecopet-green shadow-md shadow-ecopet-green/25 hover:bg-emerald-700 active:scale-95"
            )}
          >
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
            ) : (
              <Send className="h-5 w-5" aria-hidden />
            )}
          </button>
        )}
      </div>
    </div>
  );
}
