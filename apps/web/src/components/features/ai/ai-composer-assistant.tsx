"use client";

import { useState } from "react";
import { EcoPetAIButton } from "@/components/features/ai/ecopet-ai-button";

type Props = {
  endpoint: string;
  seed?: string;
  locale?: string;
  onSuggestion?: (text: string) => void;
  label?: string;
};

export function AIComposerAssistant({ endpoint, seed = "", locale = "pt-BR", onSuggestion, label = "Sugerir com IA" }: Props) {
  const [loading, setLoading] = useState(false);
  const [suggestion, setSuggestion] = useState<string | null>(null);

  async function run() {
    setLoading(true);
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input: seed || "Sugira um texto adequado.", locale }),
      });
      const json = await res.json();
      const text = json?.data?.content ?? json?.data?.reply ?? "";
      setSuggestion(text);
      onSuggestion?.(text);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <EcoPetAIButton loading={loading} onClick={() => void run()} label={label} />
      {suggestion && (
        <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3 text-sm dark:border-zinc-800 dark:bg-zinc-900">
          <p className="whitespace-pre-wrap">{suggestion}</p>
          <p className="mt-2 text-xs text-zinc-500">Revise antes de usar. Nada é publicado automaticamente.</p>
        </div>
      )}
    </div>
  );
}
