"use client";

import { useCallback, useEffect, useState } from "react";
import { AIConversationList, type AIConversationItem } from "@/components/features/ai/ai-conversation-list";
import { AIErrorState } from "@/components/features/ai/ai-error-state";
import { cn } from "@/lib/utils";

type Props = {
  className?: string;
  onSelect?: (id: string) => void;
};

export function AIHistory({ className, onSelect }: Props) {
  const [items, setItems] = useState<AIConversationItem[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/ai/history?limit=20", { credentials: "include", cache: "no-store" });
      const body = await res.json();
      if (!res.ok || body.success === false) throw new Error(body.error?.message ?? "Erro ao carregar histórico");
      const sessions = (body.data?.sessions ?? []) as Array<{
        id: string;
        type: string;
        updatedAt: string;
        messages?: { lastQuestions?: string[] };
      }>;
      setItems(
        sessions.map((s) => ({
          id: s.id,
          title: s.messages?.lastQuestions?.[s.messages.lastQuestions.length - 1] ?? s.type,
          updatedAt: s.updatedAt,
        }))
      );
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) return <p className="p-4 text-sm text-muted-foreground">Carregando histórico…</p>;
  if (error) return <AIErrorState message={error} onRetry={load} className={className} />;

  return (
    <div className={cn("rounded-lg border", className)}>
      <AIConversationList items={items} onSelect={onSelect} />
    </div>
  );
}
