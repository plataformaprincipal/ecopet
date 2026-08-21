"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Search, MessageSquarePlus, RefreshCw, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useConversationsPolling } from "@/hooks/use-message-polling";
import { ConversationItemRow } from "@/components/features/messages/conversation-item";
import { ConversationView } from "@/components/features/messages/conversation-view";
import { NewConversationModal } from "@/components/features/messages/new-conversation-modal";
import { messagesApi } from "@/lib/messages/client-api";
import { cn } from "@/lib/utils";

export function MessagesHub({ initialConversationId }: { initialConversationId?: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedId, setSelectedId] = useState(initialConversationId ?? "");
  const [q, setQ] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [newOpen, setNewOpen] = useState(false);
  const [bootstrapping, setBootstrapping] = useState(false);
  const [bootstrapError, setBootstrapError] = useState("");
  const { items, loading, error, refresh } = useConversationsPolling();

  useEffect(() => {
    const partner = searchParams.get("partner") ?? searchParams.get("userId");
    if (!partner || selectedId) return;
    let cancelled = false;
    setBootstrapping(true);
    setBootstrapError("");
    void messagesApi
      .createConversation({ participantUserIds: [partner] })
      .then((data) => {
        if (cancelled) return;
        const id = data.conversation.id;
        setSelectedId(id);
        router.replace(`/dashboard/messages/${id}`);
      })
      .catch((e) => {
        if (!cancelled) {
          setBootstrapError(e instanceof Error ? e.message : "Não foi possível carregar a conversa.");
        }
      })
      .finally(() => {
        if (!cancelled) setBootstrapping(false);
      });
    return () => {
      cancelled = true;
    };
  }, [router, searchParams, selectedId]);

  const filtered = items.filter((c) => {
    if (c.type === "SUPPORT") return false;
    if (typeFilter && c.type !== typeFilter) return false;
    if (!q.trim()) return true;
    const term = q.toLowerCase();
    return (
      c.title?.toLowerCase().includes(term) ||
      c.participants.some((p) => p.name.toLowerCase().includes(term)) ||
      c.lastMessage?.content.toLowerCase().includes(term)
    );
  });

  function selectConversation(id: string) {
    setSelectedId(id);
    router.push(`/dashboard/messages/${id}`);
  }

  const listLoading = (loading || bootstrapping) && !error && !bootstrapError;

  return (
    <div className="mx-auto flex h-[calc(100vh-8rem)] max-w-6xl flex-col gap-0 p-0 lg:flex-row lg:gap-0">
      <aside className={cn("flex w-full flex-col border-r border-[var(--ep-border)] bg-[var(--ep-bg-elevated)] lg:w-96", selectedId && "hidden lg:flex")}>
        <div className="border-b border-ecopet-gray/10 p-4 dark:border-white/10">
          <div className="mb-3 flex items-center justify-between">
            <h1 className="text-lg font-bold text-ecopet-dark dark:text-white">Mensagens</h1>
            <div className="flex gap-2">
              <Button size="icon" variant="ghost" onClick={() => void refresh()} aria-label="Atualizar">
                <RefreshCw className="h-4 w-4" />
              </Button>
              <Button size="icon" variant="outline" onClick={() => setNewOpen(true)} aria-label="Nova conversa">
                <MessageSquarePlus className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input className="pl-9" placeholder="Buscar conversas..." value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <div className="mt-2 flex flex-wrap gap-1">
            {["", "DIRECT", "CLIENT_PARTNER", "CLIENT_ONG"].map((t) => (
              <button
                key={t || "all"}
                type="button"
                onClick={() => setTypeFilter(t)}
                className={cn(
                  "rounded-full px-2 py-0.5 text-xs",
                  typeFilter === t ? "bg-ecopet-green text-white" : "bg-muted"
                )}
              >
                {t || "Todas"}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {listLoading && <p className="p-4 text-sm text-muted-foreground">Carregando conversas...</p>}
          {(error || bootstrapError) && (
            <div className="flex flex-col gap-2 p-4 text-sm text-red-600">
              <span className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4" /> {bootstrapError || error}
              </span>
              <Button size="sm" variant="outline" onClick={() => void refresh()}>
                Tentar novamente
              </Button>
            </div>
          )}
          {!listLoading && !error && !bootstrapError && filtered.length === 0 && (
            <div className="p-6 text-center text-sm text-[var(--ep-fg-muted)]">
              <p>Suas conversas aparecerão aqui.</p>
              <Button className="mt-3" onClick={() => setNewOpen(true)}>Iniciar conversa</Button>
            </div>
          )}
          {filtered.map((c) => (
            <ConversationItemRow
              key={c.id}
              conversation={c}
              active={c.id === selectedId}
              onClick={() => selectConversation(c.id)}
            />
          ))}
        </div>

        <div className="border-t border-ecopet-gray/10 p-3 text-center text-xs dark:border-white/10">
          <Link href="/dashboard/support" className="text-ecopet-green hover:underline">Abrir suporte</Link>
        </div>
      </aside>

      <main className={cn("flex min-h-0 flex-1 flex-col bg-[var(--ep-bg)]", !selectedId && "hidden lg:flex")}>
        {selectedId ? (
          <ConversationView conversationId={selectedId} onBack={() => { setSelectedId(""); router.push("/dashboard/messages"); }} />
        ) : (
          <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
            Selecione uma conversa para começar
          </div>
        )}
      </main>

      <NewConversationModal open={newOpen} onClose={() => setNewOpen(false)} onCreated={(id) => { setNewOpen(false); selectConversation(id); void refresh(); }} />
    </div>
  );
}
