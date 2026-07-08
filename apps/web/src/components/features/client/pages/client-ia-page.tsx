"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Brain, History, Sparkles, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ClientPageHeader } from "../client-page-header";
import { ClientPageSkeleton } from "../client-skeleton";
import { ClientEmptyState } from "../client-empty-state";
import type { ClientAiMemoryPanel } from "@/lib/client/client-ai-memory";

export function ClientIaPage() {
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [memory, setMemory] = useState<ClientAiMemoryPanel | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [statusRes, memoryRes] = await Promise.all([
        fetch("/api/client/ai/status", { credentials: "include", cache: "no-store" }),
        fetch("/api/client/ai/memory", { credentials: "include", cache: "no-store" }),
      ]);
      const statusJson = await statusRes.json();
      const memoryJson = await memoryRes.json();
      if (statusJson.success) setConfigured(statusJson.data.configured as boolean);
      if (memoryJson.success) setMemory(memoryJson.data.memory as ClientAiMemoryPanel);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) return <ClientPageSkeleton />;

  return (
    <div className="space-y-6">
      <ClientPageHeader
        title="Inteligência Artificial"
        description="Assistente, memória e contexto dos seus pets."
        actions={
          <Button asChild size="sm">
            <Link href="/cliente/assistente">Abrir assistente</Link>
          </Button>
        }
      />

      <section className="rounded-2xl border border-zinc-200/80 bg-white p-5 dark:border-white/10 dark:bg-zinc-900/60">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-emerald-600" aria-hidden />
          <h2 className="font-semibold">Status do provedor</h2>
        </div>
        {configured ? (
          <p className="mt-2 text-sm text-emerald-700 dark:text-emerald-400">Provedor de IA configurado e pronto.</p>
        ) : (
          <p className="mt-2 text-sm text-amber-700 dark:text-amber-400">IA ainda não configurada.</p>
        )}
      </section>

      <section className="rounded-2xl border border-zinc-200/80 bg-white p-5 dark:border-white/10 dark:bg-zinc-900/60">
        <div className="mb-3 flex items-center gap-2">
          <Brain className="h-5 w-5 text-violet-600" aria-hidden />
          <h2 className="font-semibold">Memória do tutor</h2>
        </div>
        {!memory || (!memory.user.summary && memory.user.lastQuestions.length === 0) ? (
          <ClientEmptyState
            icon={History}
            title="Memória vazia"
            description="Converse com o assistente para construir preferências, hábitos e contexto."
            actionLabel="Abrir assistente"
            actionHref="/cliente/assistente"
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            <MemoryBlock title="Preferências" items={Object.keys(memory.user.preferences)} empty="Nenhuma preferência registrada." />
            <MemoryBlock title="Últimas perguntas" items={memory.user.lastQuestions} />
            <MemoryBlock title="Hábitos" items={memory.user.habits} empty="Nenhum hábito registrado." />
            <MemoryBlock title="Objetivos" items={memory.user.goals} empty="Nenhum objetivo registrado." />
            <MemoryBlock title="Restrições" items={memory.user.restrictions} empty="Nenhuma restrição registrada." />
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-zinc-200/80 bg-white p-5 dark:border-white/10 dark:bg-zinc-900/60">
        <div className="mb-3 flex items-center gap-2">
          <Target className="h-5 w-5 text-sky-600" aria-hidden />
          <h2 className="font-semibold">Contexto dos pets</h2>
        </div>
        {!memory || memory.pets.length === 0 ? (
          <p className="text-sm text-zinc-500">Cadastre um pet para habilitar memória contextual.</p>
        ) : (
          <ul className="space-y-2">
            {memory.pets.map((p) => (
              <li key={p.petId} className="rounded-xl border border-zinc-100 px-3 py-2 text-sm dark:border-white/5">
                <p className="font-medium">{p.petName}</p>
                <p className="text-zinc-500">
                  {p.memory.summary || "Sem resumo ainda"}
                  {p.memory.lastQuestions.length > 0 ? ` · ${p.memory.lastQuestions.length} interações` : ""}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      {memory && memory.conversations.length > 0 ? (
        <section className="rounded-2xl border border-zinc-200/80 bg-white p-5 dark:border-white/10 dark:bg-zinc-900/60">
          <h2 className="mb-3 font-semibold">Histórico de conversas</h2>
          <ul className="space-y-2">
            {memory.conversations.slice(0, 8).map((c) => (
              <li key={c.id} className="flex items-center justify-between text-sm">
                <span className="truncate">{c.title ?? "Conversa"}</span>
                <span className="ml-2 shrink-0 text-zinc-500">{c.messageCount} msgs</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}

function MemoryBlock({ title, items, empty }: { title: string; items: string[]; empty?: string }) {
  return (
    <div className="rounded-xl border border-zinc-100 p-3 dark:border-white/5">
      <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">{title}</p>
      {items.length === 0 ? (
        <p className="mt-1 text-sm text-zinc-500">{empty ?? "—"}</p>
      ) : (
        <ul className="mt-1 space-y-1">
          {items.slice(0, 5).map((item) => (
            <li key={item} className="truncate text-sm text-zinc-800 dark:text-zinc-200">{item}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
