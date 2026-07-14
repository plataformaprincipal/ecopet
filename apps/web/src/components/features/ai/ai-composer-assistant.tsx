"use client";

import { useState } from "react";
import { EcoPetAIButton } from "@/components/features/ai/ecopet-ai-button";
import {
  AiUnavailableBanner,
  isAiNotConfiguredErrorCode,
} from "@/components/features/ai/ai-unavailable-banner";
import { AIReviewConfirm } from "@/components/features/ai/ai-review-confirm";

type Props = {
  endpoint: string;
  seed?: string;
  locale?: string;
  /** Called only after the user confirms “Revisar e confirmar”. */
  onSuggestion?: (text: string) => void;
  label?: string;
};

export function AIComposerAssistant({
  endpoint,
  seed = "",
  locale = "pt-BR",
  onSuggestion,
  label = "Sugerir com IA",
}: Props) {
  const [loading, setLoading] = useState(false);
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [unavailable, setUnavailable] = useState(false);
  const [unavailableMessage, setUnavailableMessage] = useState<string | null>(null);

  async function run() {
    if (unavailable) return;
    setLoading(true);
    setError(null);
    setSuggestion(null);
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input: seed || "Sugira um texto adequado.", locale }),
      });
      const json = await res.json().catch(() => ({}));
      const code = json?.error?.code as string | undefined;

      if (!res.ok || json?.success === false) {
        if (isAiNotConfiguredErrorCode(code)) {
          setUnavailable(true);
          setUnavailableMessage(json?.error?.message ?? null);
          setSuggestion(null);
          return;
        }
        setError(json?.error?.message || "Não foi possível gerar sugestão.");
        return;
      }

      const text = (json?.data?.content ?? json?.data?.reply ?? "").trim();
      if (!text) {
        setError("Resposta vazia da IA.");
        return;
      }
      // Never auto-apply — user must confirm via AIReviewConfirm
      setSuggestion(text);
    } catch {
      setError("Falha de conexão ao solicitar a IA.");
    } finally {
      setLoading(false);
    }
  }

  if (unavailable) {
    return (
      <AiUnavailableBanner
        title="IA indisponível"
        message={unavailableMessage ?? undefined}
      />
    );
  }

  return (
    <div className="space-y-2">
      <EcoPetAIButton loading={loading} onClick={() => void run()} label={label} disabled={loading} />
      {error && (
        <p className="text-xs text-red-600" role="alert">
          {error}
        </p>
      )}
      {suggestion && (
        <AIReviewConfirm
          title="Revisar sugestão da IA"
          summary={suggestion}
          confirmLabel="Revisar e confirmar"
          cancelLabel="Descartar"
          onConfirm={() => {
            onSuggestion?.(suggestion);
            setSuggestion(null);
          }}
          onCancel={() => setSuggestion(null)}
        />
      )}
    </div>
  );
}
