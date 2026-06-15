"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Search, MessageSquarePlus, RefreshCw, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useConversationsPolling } from "@/hooks/use-message-polling";
import { ConversationItemRow } from "@/components/features/messages/conversation-item";
import { ConversationView } from "@/components/features/messages/conversation-view";
import { NewConversationModal } from "@/components/features/messages/new-conversation-modal";
import { cn } from "@/lib/utils";

export function MessagesHub({ initialConversationId }: { initialConversationId?: string }) {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState(initialConversationId ?? "");
  const [q, setQ] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [newOpen, setNewOpen] = useState(false);
  const { items, loading, error, refresh } = useConversationsPolling();

  const filtered = items.filter((c) => {
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

  return (
    <div className="mx-auto flex h-[calc(100vh-8rem)] max-w-6xl flex-col gap-4 p-4 lg:flex-row">
      <aside className={cn("flex w-full flex-col rounded-2xl border bg-white dark:bg-[#0f1419] lg:w-96", selectedId && "hidden lg:flex")}>
        <div className="border-b p-4">
          <div className="mb-3 flex items-center justify-between">
            <h1 className="text-lg font-bold">Mensagens</h1>
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
            {["", "DIRECT", "CLIENT_PARTNER", "CLIENT_ONG", "SUPPORT"].map((t) => (
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
          {loading && <p className="p-4 text-sm text-muted-foreground">Carregando conversas...</p>}
          {error && (
            <div className="flex items-center gap-2 p-4 text-sm text-red-600">
              <AlertCircle className="h-4 w-4" /> {error}
              <Button size="sm" variant="outline" onClick={() => void refresh()}>Tentar novamente</Button>
            </div>
          )}
          {!loading && !error && filtered.length === 0 && (
            <div className="p-6 text-center text-sm text-muted-foreground">
              <p>Nenhuma conversa ainda.</p>
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

        <div className="border-t p-3 text-center text-xs">
          <Link href="/dashboard/support" className="text-ecopet-green hover:underline">Abrir suporte</Link>
        </div>
      </aside>

      <main className={cn("flex min-h-0 flex-1 flex-col rounded-2xl border bg-white dark:bg-[#0f1419]", !selectedId && "hidden lg:flex")}>
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
