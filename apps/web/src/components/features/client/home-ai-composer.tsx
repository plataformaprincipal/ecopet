"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Paperclip, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AI_COMMERCE_PRODUCTS } from "@/lib/ai-commerce/catalog";

const CHIPS = [
  { label: "Saúde", href: "/eccopet/vet" },
  { label: "Emergência", href: "/marketplace/emergencia" },
  { label: "Alimentação", href: "/eccopet/nutri" },
  { label: "Peso", href: "/eccopet/peso" },
  { label: "Vacinas", href: "/eccopet/vacina" },
  { label: "Comportamento", href: "/eccopet/behavior" },
  { label: "Exames", href: "/eccopet/exames" },
  { label: "Ver especialistas", href: "/eccopet" },
];

type Pet = { id: string; name: string };

export function HomeAiComposer({ userName }: { userName: string }) {
  const firstName = userName.split(" ")[0] || "tutor";
  const [pets, setPets] = useState<Pet[]>([]);
  const [petId, setPetId] = useState("");
  const [text, setText] = useState("");
  const [reply, setReply] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [conversationId, setConversationId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/ai-commerce/pets", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => {
        if (!d.success) return;
        const list = (d.data.pets ?? []) as Pet[];
        setPets(list);
        if (list.length === 1) setPetId(list[0]!.id);
      })
      .catch(() => undefined);
  }, []);

  const petName = pets.find((p) => p.id === petId)?.name ?? pets[0]?.name ?? "seu pet";

  async function send() {
    const message = text.trim();
    if (!message || busy) return;
    setBusy(true);
    setError("");
    setReply("");
    try {
      const res = await fetch("/api/ai/chat/stream", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message,
          petId: petId || undefined,
          conversationId,
          pagePath: "/cliente",
          module: "home-ai",
        }),
      });
      if (res.status === 401) {
        setError("Entre na sua conta para conversar.");
        return;
      }
      if (!res.ok || !res.body) {
        const json = await res.json().catch(() => null);
        setError(json?.error?.message ?? "Não foi possível responder agora.");
        return;
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let assembled = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split("\n\n");
        buffer = parts.pop() ?? "";
        for (const part of parts) {
          const line = part.replace(/^data:\s*/, "").trim();
          if (!line) continue;
          try {
            const event = JSON.parse(line) as { type?: string; text?: string; content?: string; conversationId?: string; message?: string };
            if (event.type === "delta" && event.text) {
              assembled += event.text;
              setReply(assembled);
            }
            if (event.type === "done") {
              assembled = event.content || assembled;
              setReply(assembled);
              if (event.conversationId) setConversationId(event.conversationId);
            }
            if (event.type === "error") setError(event.message ?? "Erro na conversa.");
          } catch {
            /* ignore malformed SSE */
          }
        }
      }
      if (!assembled && !error) setError("Não recebemos uma resposta. Tente novamente.");
    } catch {
      setError("Não foi possível responder agora.");
    } finally {
      setBusy(false);
      setText("");
    }
  }

  return (
    <section className="rounded-[24px] border border-[var(--ep-border)] bg-[var(--ep-bg-elevated)] p-5 sm:p-6" data-testid="home-ai-composer">
      <p className="text-sm text-[var(--ep-fg-muted)]">Olá, {firstName}.</p>
      <h2 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">Como posso ajudar {petName} hoje?</h2>
      <div className="mt-5 flex items-center gap-3">
        <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-ecopet-green text-lg font-semibold text-white">E</span>
        <div>
          <p className="font-semibold">EccoPet AI</p>
          <p className="text-sm text-[var(--ep-fg-muted)]">Pergunte qualquer coisa sobre seu pet</p>
        </div>
      </div>
      {pets.length > 1 ? (
        <select
          className="mt-4 max-w-xs rounded-xl border border-[var(--ep-border)] bg-[var(--ep-bg)] px-3 py-2 text-sm"
          value={petId}
          onChange={(e) => setPetId(e.target.value)}
          aria-label="Pet"
        >
          {pets.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      ) : null}
      <form
        className="mt-4 flex items-end gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          void send();
        }}
      >
        <label className="inline-flex min-h-11 cursor-pointer items-center rounded-full border border-[var(--ep-border)] px-3 text-sm text-[var(--ep-fg-muted)]">
          <Paperclip className="h-4 w-4" />
          <span className="sr-only">Anexar</span>
          <input type="file" className="hidden" disabled title="Anexe dentro do especialista de exames ou vision" />
        </label>
        <input
          className="min-h-11 flex-1 rounded-full border border-[var(--ep-border)] bg-[var(--ep-bg)] px-4 text-sm"
          placeholder="Pergunte qualquer coisa sobre seu pet..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          aria-label="Pergunte qualquer coisa sobre seu pet"
        />
        <Button type="submit" loading={busy} disabled={busy || !text.trim()} aria-label="Enviar">
          <Send className="h-4 w-4" />
        </Button>
      </form>
      <div className="mt-3 flex flex-wrap gap-2">
        {CHIPS.map((chip) => (
          <Link
            key={chip.label}
            href={chip.href}
            className="rounded-full border border-[var(--ep-border)] px-3 py-1.5 text-xs font-medium hover:border-ecopet-green"
          >
            {chip.label}
          </Link>
        ))}
      </div>
      {busy && !reply ? <p className="mt-3 text-sm text-[var(--ep-fg-muted)]">Pensando…</p> : null}
      {reply ? (
        <div className="mt-4 rounded-2xl bg-[var(--ep-bg)] p-4 text-sm leading-relaxed" aria-live="polite">
          {reply}
        </div>
      ) : null}
      {error ? (
        <p className="mt-3 text-sm text-red-600" role="alert">
          {error}{" "}
          <button type="button" className="underline" onClick={() => void send()}>
            Tentar novamente
          </button>
        </p>
      ) : null}

      <div className="mt-8">
        <h3 className="text-lg font-semibold">Especialistas para seu pet</h3>
        <div className="mt-3 flex gap-3 overflow-x-auto pb-2">
          {AI_COMMERCE_PRODUCTS.map((p) => (
            <Link
              key={p.sku}
              href={p.href}
              className="min-w-[180px] shrink-0 rounded-2xl border border-[var(--ep-border)] p-4 text-sm hover:border-ecopet-green"
            >
              <p className="font-semibold">{p.name}</p>
              <p className="mt-1 text-[var(--ep-fg-muted)]">{p.shortDescription}</p>
              <p className="mt-2 text-xs font-medium text-ecopet-green">{p.ctaLabel}</p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
