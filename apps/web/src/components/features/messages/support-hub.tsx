"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supportApi, type SupportTicketItem } from "@/lib/messages/client-api";

export function SupportHub({ admin = false }: { admin?: boolean }) {
  const router = useRouter();
  const [tickets, setTickets] = useState<SupportTicketItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [q, setQ] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const path = admin ? `/api/admin/support/tickets${q ? `?q=${encodeURIComponent(q)}` : ""}` : `/api/support/tickets${q ? `?q=${encodeURIComponent(q)}` : ""}`;
      const res = await fetch(path, { credentials: "include" });
      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message);
      setTickets(json.data.items);
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro");
    } finally {
      setLoading(false);
    }
  }, [admin, q]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="mx-auto max-w-3xl space-y-4 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">{admin ? "Suporte — Admin" : "Meu Suporte"}</h1>
        {!admin && (
          <Button asChild><Link href="/dashboard/support/new">Novo chamado</Link></Button>
        )}
      </div>
      <Input placeholder="Buscar por assunto..." value={q} onChange={(e) => setQ(e.target.value)} />
      {loading && <p className="text-sm text-muted-foreground">Carregando...</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}
      {!loading && tickets.length === 0 && <p className="text-sm text-muted-foreground">Nenhum chamado encontrado.</p>}
      <div className="space-y-2">
        {tickets.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => router.push(admin ? `/dashboard/admin/support/${t.id}` : `/dashboard/support/${t.id}`)}
            className="w-full rounded-xl border p-4 text-left hover:bg-muted/40"
          >
            <p className="font-semibold">#{t.number} — {t.subject}</p>
            <p className="text-xs text-muted-foreground">{t.status} · {t.priority} · {t.category}</p>
          </button>
        ))}
      </div>
    </div>
  );
}

export function SupportTicketForm() {
  const router = useRouter();
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const { ticket } = await supportApi.createTicket({ subject, description, category: "OTHER" });
      router.push(`/dashboard/support/${ticket.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="mx-auto max-w-lg space-y-4 p-6">
      <h1 className="text-xl font-bold">Novo chamado de suporte</h1>
      <Input placeholder="Assunto" value={subject} onChange={(e) => setSubject(e.target.value)} required />
      <textarea
        className="min-h-32 w-full rounded-md border p-3 text-sm"
        placeholder="Descreva seu problema..."
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        required
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <Button type="submit" disabled={loading}>{loading ? "Enviando..." : "Abrir chamado"}</Button>
    </form>
  );
}

export function SupportTicketView({ ticketId, admin = false }: { ticketId: string; admin?: boolean }) {
  const [ticket, setTicket] = useState<SupportTicketItem | null>(null);
  const [content, setContent] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const path = admin ? `/api/admin/support/tickets/${ticketId}` : `/api/support/tickets/${ticketId}`;
    const res = await fetch(path, { credentials: "include" });
    const json = await res.json();
    if (json.success) setTicket(json.data.ticket);
  }, [admin, ticketId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;
    try {
      await supportApi.sendTicketMessage(ticketId, content);
      setContent("");
      void load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro");
    }
  }

  if (!ticket) return <p className="p-6 text-sm">Carregando ticket...</p>;

  return (
    <div className="mx-auto max-w-2xl space-y-4 p-6">
      <h1 className="text-xl font-bold">#{ticket.number} — {ticket.subject}</h1>
      <p className="text-sm text-muted-foreground">{ticket.description}</p>
      {admin && (
        <div className="flex gap-2">
          <Button size="sm" onClick={() => supportApi.updateTicket(ticketId, { action: "assign" })}>Assumir</Button>
          <Button size="sm" variant="outline" onClick={() => supportApi.updateTicket(ticketId, { status: "CLOSED" })}>Fechar</Button>
        </div>
      )}
      {!admin && (
        <Button size="sm" variant="outline" onClick={() => supportApi.updateTicket(ticketId, { status: "CLOSED" })}>Fechar chamado</Button>
      )}
      {ticket.conversation?.id && (
        <Link href={`/dashboard/messages/${ticket.conversation.id}`} className="text-sm text-ecopet-green hover:underline">
          Abrir conversa do chamado
        </Link>
      )}
      <form onSubmit={send} className="flex gap-2">
        <Input value={content} onChange={(e) => setContent(e.target.value)} placeholder="Responder..." />
        <Button type="submit">Enviar</Button>
      </form>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
