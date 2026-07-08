"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Home, Plug } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ClientPageHeader } from "../client-page-header";
import { ClientPageSkeleton } from "../client-skeleton";
import type { ClientAutomationsPanel } from "@/lib/client/automations";

export function ClientCasaInteligentePage() {
  const [data, setData] = useState<ClientAutomationsPanel | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/client/automations", { credentials: "include", cache: "no-store" });
      const json = await res.json();
      if (json.success) setData(json.data.automations as ClientAutomationsPanel);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) return <ClientPageSkeleton />;
  if (!data) return null;

  return (
    <div className="space-y-6">
      <ClientPageHeader
        title="Casa Inteligente"
        description="Integração futura com Alexa, Google Home, Apple Home e SmartThings."
        actions={
          <Button asChild size="sm" variant="outline">
            <Link href="/cliente/iot">Ver dispositivos IoT</Link>
          </Button>
        }
      />

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">Plataformas</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {data.smartHome.platforms.map((p) => (
            <div key={p.id} className="flex items-center justify-between rounded-2xl border border-zinc-200/80 bg-white p-4 dark:border-white/10 dark:bg-zinc-900/60">
              <div className="flex items-center gap-3">
                <Plug className="h-5 w-5 text-zinc-400" aria-hidden />
                <span className="font-medium">{p.name}</span>
              </div>
              <span className="rounded-full bg-zinc-500/10 px-2 py-0.5 text-xs font-medium text-zinc-600 dark:text-zinc-300">
                Integração pendente
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">Cenários de automação</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {data.smartHome.scenarios.map((s) => (
            <article key={s.id} className="rounded-2xl border border-zinc-200/80 bg-white p-4 dark:border-white/10 dark:bg-zinc-900/60">
              <div className="flex items-center gap-2">
                <Home className="h-4 w-4 text-emerald-600" aria-hidden />
                <p className="font-medium">{s.name}</p>
              </div>
              <p className="mt-1 text-sm text-zinc-500">{s.description}</p>
              <span className="mt-2 inline-block rounded-full bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-700 dark:text-amber-400">
                Aguardando integração
              </span>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
