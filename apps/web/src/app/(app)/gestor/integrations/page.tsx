"use client";

import { useEffect, useState } from "react";
import { GestorPageHeader, GestorLoading, GestorError } from "@/components/gestor/gestor-shell";
import { api } from "@/lib/api";
import { useAppStore } from "@/store/app-store";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface Integration {
  id: string;
  provider: string;
  name: string;
  status: string;
  lastSyncAt?: string;
}

export default function GestorIntegrationsPage() {
  const [items, setItems] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = useAppStore.getState().apiToken;
    api<Integration[]>("/api/integrations", { token: token ?? undefined })
      .then(setItems)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <GestorLoading />;
  if (error) return <GestorError message={error} />;

  return (
    <>
      <GestorPageHeader title="Integrações" description="Redes sociais, WhatsApp, ERP, CRM — conectar, monitorar e auditar" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.length === 0 ? (
          <p className="text-ecopet-gray col-span-full">Nenhuma integração cadastrada ainda.</p>
        ) : items.map((i) => (
          <article key={i.id} className="card-premium rounded-[16px] border p-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">{i.name}</h3>
              <Badge variant={i.status === "CONNECTED" ? "verified" : "secondary"}>{i.status}</Badge>
            </div>
            <p className="text-sm text-ecopet-gray">{i.provider}</p>
            {i.lastSyncAt && <p className="mt-2 text-xs text-ecopet-gray">Sync: {new Date(i.lastSyncAt).toLocaleString("pt-BR")}</p>}
            <Button size="sm" variant="outline" className="mt-3">Configurar</Button>
          </article>
        ))}
      </div>
    </>
  );
}
