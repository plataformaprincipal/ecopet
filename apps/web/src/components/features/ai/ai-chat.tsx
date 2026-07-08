"use client";

import { useCallback, useEffect, useState } from "react";
import { AIConversation, type AIConversationMessage } from "@/components/features/ai/ai-conversation";
import { AIInput } from "@/components/features/ai/ai-input";
import { AIAgentSelector, type AIAgentOption } from "@/components/features/ai/ai-agent-selector";
import { AITokenCounter } from "@/components/features/ai/ai-token-counter";
import { AIErrorState } from "@/components/features/ai/ai-error-state";
import { cn } from "@/lib/utils";

type Props = {
  className?: string;
  defaultAgentId?: string;
};

export function AIChat({ className, defaultAgentId }: Props) {
  const [agents, setAgents] = useState<AIAgentOption[]>([]);
  const [agentId, setAgentId] = useState(defaultAgentId ?? "");
  const [messages, setMessages] = useState<AIConversationMessage[]>([]);
  const [usage, setUsage] = useState({ input: 0, output: 0, cost: 0 });
  const [providerError, setProviderError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch("/api/ai/agents", { credentials: "include" });
        const body = await res.json();
        if (body.success) {
          const list = body.data.agents as AIAgentOption[];
          setAgents(list);
          if (!agentId && list[0]) setAgentId(list[0].id);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [agentId]);

  const sendMessage = useCallback(
    async (text: string) => {
      setProviderError(null);
      const userMsg: AIConversationMessage = {
        id: `u-${Date.now()}`,
        role: "user",
        content: text,
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, userMsg]);

      const res = await fetch("/api/ai/chat", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, agentId: agentId || undefined }),
      });
      const body = await res.json();

      if (!res.ok || body.success === false) {
        setProviderError(body.error?.message ?? "AI Provider not configured.");
        return;
      }

      const data = body.data;
      if (data.content) {
        setMessages((prev) => [
          ...prev,
          {
            id: `a-${Date.now()}`,
            role: "assistant",
            content: data.content,
            createdAt: new Date().toISOString(),
          },
        ]);
      }
      if (data.usage) {
        setUsage({
          input: data.usage.promptTokens ?? 0,
          output: data.usage.completionTokens ?? 0,
          cost: data.estimatedCostUsd ?? 0,
        });
      }
    },
    [agentId]
  );

  if (loading) {
    return <p className="p-4 text-sm text-muted-foreground">Carregando assistente…</p>;
  }

  return (
    <div className={cn("flex flex-col rounded-lg border", className)}>
      <div className="border-b p-3">
        <AIAgentSelector agents={agents} value={agentId} onChange={setAgentId} />
      </div>
      <div className="min-h-[280px] flex-1">
        {providerError ? (
          <div className="p-4">
            <AIErrorState message={providerError} onRetry={() => setProviderError(null)} />
          </div>
        ) : (
          <AIConversation messages={messages} className="min-h-[280px] max-h-[480px]" />
        )}
      </div>
      <div className="space-y-2 border-t p-3">
        <AITokenCounter input={usage.input} output={usage.output} estimatedCostUsd={usage.cost} />
        <AIInput onSend={sendMessage} disabled={!!providerError} />
      </div>
    </div>
  );
}
