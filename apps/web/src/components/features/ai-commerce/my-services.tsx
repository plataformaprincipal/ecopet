"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { analyticsService } from "@/lib/analytics/service";
import { AiEvents } from "@/lib/analytics/events";

type Item = {
  id: string;
  name: string;
  status: string;
  remaining: number;
  purchasedAt: string;
  pet: { name: string };
  href?: string | null;
  latestExecution: { href?: string; status: string } | null;
  sku: string;
  orderId: string;
};

export function MyAiServicesPage() {
  const router = useRouter();
  const [items, setItems] = useState<Item[] | null>(null);
  const [tab, setTab] = useState<"available" | "progress" | "done" | "history">("available");
  const [busy, setBusy] = useState<string | null>(null);

  async function start(item: Item) {
    setBusy(item.id);
    const res = await fetch("/api/ai-commerce/executions", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ entitlementId: item.id }),
    });
    const data = await res.json();
    setBusy(null);
    if (data.success) {
      analyticsService.track(AiEvents.EXECUTION_STARTED, {
        screen: "minha_conta_ia",
        label: item.sku,
      });
      const slug = item.href?.split("/")[2] ?? "vet";
      router.push(`/eccopet/${slug}/session/${data.data.executionId}`);
    }
  }

  useEffect(() => {
    fetch("/api/ai-commerce/entitlements", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => setItems(d.success ? d.data.items : []));
  }, []);

  if (!items) return <p className="p-8 text-sm text-muted-foreground">Carregando…</p>;

  const filtered = items.filter((i) => {
    if (tab === "available") return (i.status === "AVAILABLE" || i.status === "ACTIVE") && i.remaining > 0;
    if (tab === "progress") return i.status === "IN_USE";
    if (tab === "done") return i.status === "CONSUMED";
    return true;
  });

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-3xl font-semibold">Meus serviços de IA</h1>
      <div className="mt-6 flex flex-wrap gap-2">
        {[
          ["available", "Disponíveis"],
          ["progress", "Em andamento"],
          ["done", "Concluídos"],
          ["history", "Histórico"],
        ].map(([id, label]) => (
          <button
            key={id}
            className={`rounded-full border px-4 py-1 text-sm ${tab === id ? "border-ecopet-green bg-ecopet-green/10" : ""}`}
            onClick={() => setTab(id as typeof tab)}
          >
            {label}
          </button>
        ))}
      </div>
      {filtered.length === 0 && (
        <p className="mt-8 text-sm text-muted-foreground">
          Nenhum serviço comprado. Escolha uma ferramenta EccoPet AI para começar.
        </p>
      )}
      {filtered.length === 0 && (
        <Button asChild className="mt-4">
          <Link href="/eccopet">Explorar ferramentas</Link>
        </Button>
      )}
      <ul className="mt-6 space-y-4">
        {filtered.map((i) => (
          <li key={i.id} className="rounded-2xl border border-black/5 p-5 dark:border-white/10">
            <p className="font-semibold">{i.name}</p>
            <p className="text-sm text-muted-foreground">Pet: {i.pet.name}</p>
            <p className="text-sm text-muted-foreground">
              Comprado em {new Date(i.purchasedAt).toLocaleDateString("pt-BR")}
            </p>
            <p className="text-sm">{i.remaining} utilização disponível</p>
            {i.status === "ACTIVE" && <p className="text-sm text-ecopet-green">Plano de 30 dias ativo</p>}
            <div className="mt-3 flex flex-wrap gap-2">
              {i.remaining > 0 && (
                <Button size="sm" loading={busy === i.id} onClick={() => start(i)}>
                  Usar agora
                </Button>
              )}
              <Button asChild size="sm" variant="outline">
                <Link
                  href={i.href ?? "/eccopet"}
                  onClick={() => analyticsService.track(AiEvents.REPURCHASE, { label: i.sku })}
                >
                  {i.sku.includes("ECCOVET") && i.remaining === 0 ? "Renovar plano" : "Comprar novamente"}
                </Link>
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
