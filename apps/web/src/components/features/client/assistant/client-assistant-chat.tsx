"use client";

import { useCallback, useEffect, useState } from "react";
import {
  CalendarClock,
  FileText,
  HeartPulse,
  ListChecks,
  PiggyBank,
  ShoppingBag,
  Sparkles,
  Stethoscope,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { AIConversation, type AIConversationMessage } from "@/components/features/ai/ai-conversation";
import { AIInput } from "@/components/features/ai/ai-input";
import { AITokenCounter } from "@/components/features/ai/ai-token-counter";
import { AIErrorState } from "@/components/features/ai/ai-error-state";
import { ClientPageSkeleton } from "../client-skeleton";
import { cn } from "@/lib/utils";

const TOPICS = [
  { id: "pet", label: "Saúde do pet", icon: HeartPulse, agentId: "pet", prompt: "Como está a saúde do meu pet?" },
  { id: "routine", label: "Rotina", icon: ListChecks, agentId: "pet", prompt: "O que preciso fazer na rotina hoje?" },
  { id: "products", label: "Produtos", icon: ShoppingBag, agentId: "marketplace", prompt: "Quais produtos você recomenda?" },
  { id: "services", label: "Serviços", icon: Stethoscope, agentId: "marketplace", prompt: "Quais serviços estão disponíveis?" },
  { id: "orders", label: "Compras", icon: ShoppingBag, agentId: "marketplace", prompt: "Resumo das minhas compras recentes" },
  { id: "agenda", label: "Agenda", icon: CalendarClock, agentId: "client", integrationPoint: "agenda", prompt: "Quais são meus próximos compromissos?" },
  { id: "finance", label: "Financeiro", icon: PiggyBank, agentId: "finance", prompt: "Quanto gastei este mês com meus pets?" },
  { id: "documents", label: "Documentos", icon: FileText, agentId: "pet", prompt: "Quais documentos do pet estão registrados?" },
] as const;

type Props = {
  className?: string;
  petId?: string;
};

export function ClientAssistantChat({ className, petId }: Props) {
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [messages, setMessages] = useState<AIConversationMessage[]>([]);
  const [usage, setUsage] = useState({ input: 0, output: 0, cost: 0 });
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [activeTopic, setActiveTopic] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      const res = await fetch("/api/client/ai/status", { credentials: "include" });
      const json = await res.json();
      if (json.success) setConfigured(json.data.configured as boolean);
      else setConfigured(false);
    })();
  }, []);

  const sendMessage = useCallback(
    async (text: string, opts?: { agentId?: string; integrationPoint?: string }) => {
      setError(null);
      setSending(true);
      const userMsg: AIConversationMessage = {
        id: `u-${Date.now()}`,
        role: "user",
        content: text,
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, userMsg]);

      try {
        const res = await fetch("/api/client/ai/chat", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: text,
            agentId: opts?.agentId,
            petId,
            integrationPoint: opts?.integrationPoint,
          }),
        });
        const body = await res.json();

        if (!res.ok || body.success === false) {
          setError(body.error?.message ?? "IA ainda não configurada.");
          return;
        }

        const data = body.data;
        if (data.content) {
          setMessages((prev) => [
            ...prev,
            { id: `a-${Date.now()}`, role: "assistant", content: data.content, createdAt: new Date().toISOString() },
          ]);
        }
        if (data.usage) {
          setUsage({
            input: data.usage.promptTokens ?? 0,
            output: data.usage.completionTokens ?? 0,
            cost: data.estimatedCostUsd ?? 0,
          });
        }
      } catch {
        setError("Erro ao comunicar com o assistente.");
      } finally {
        setSending(false);
      }
    },
    [petId]
  );

  if (configured === null) return <ClientPageSkeleton />;

  if (configured === false) {
    return (
      <div className={cn("rounded-2xl border border-amber-200 bg-amber-50 p-6 dark:border-amber-900 dark:bg-amber-950/20", className)}>
        <div className="flex items-center gap-2 text-amber-800 dark:text-amber-200">
          <Sparkles className="h-5 w-5" aria-hidden />
          <p className="font-semibold">IA ainda não configurada.</p>
        </div>
        <p className="mt-2 text-sm text-amber-700 dark:text-amber-300">
          O assistente inteligente estará disponível assim que o provedor de IA for integrado à plataforma.
        </p>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col rounded-2xl border border-zinc-200/80 bg-white dark:border-white/10 dark:bg-zinc-900/60", className)}>
      <div className="border-b p-3">
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-zinc-500">Assuntos</p>
        <div className="flex flex-wrap gap-2">
          {TOPICS.map((t) => (
            <Button
              key={t.id}
              type="button"
              size="sm"
              variant={activeTopic === t.id ? "default" : "outline"}
              className="gap-1.5"
              disabled={sending}
              onClick={() => {
                setActiveTopic(t.id);
                void sendMessage(t.prompt, { agentId: t.agentId, integrationPoint: "integrationPoint" in t ? t.integrationPoint : undefined });
              }}
            >
              <t.icon className="h-3.5 w-3.5" aria-hidden />
              {t.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="min-h-[300px] flex-1">
        {error ? (
          <div className="p-4">
            <AIErrorState message={error} onRetry={() => setError(null)} />
          </div>
        ) : (
          <AIConversation messages={messages} className="min-h-[300px] max-h-[480px]" />
        )}
      </div>

      <div className="space-y-2 border-t p-3">
        <AITokenCounter input={usage.input} output={usage.output} estimatedCostUsd={usage.cost} />
        <AIInput onSend={(text) => sendMessage(text)} disabled={sending || !!error} />
      </div>
    </div>
  );
}
